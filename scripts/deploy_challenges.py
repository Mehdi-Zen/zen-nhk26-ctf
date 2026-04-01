#!/usr/bin/env python3
"""
Deploy CTF challenges to CTFd instance via API
Supports: container, dynamic, firstblood challenge types
"""
import yaml
import requests
import sys
import os
from pathlib import Path


def upload_file(file_path, ctfd_url, headers, challenge_id=None):
    """
    Upload a file to CTFd.
    If challenge_id is provided, attach to challenge. Otherwise, upload to Media Library.
    """
    if not file_path.exists():
        print(f"  ⚠️  File not found: {file_path}")
        return None

    upload_headers = {'Authorization': headers['Authorization']}

    with open(file_path, 'rb') as f:
        files = {'file': (file_path.name, f)}
        form_data = {}

        if challenge_id:
            form_data['challenge_id'] = challenge_id
            form_data['type'] = 'challenge'
        else:
            form_data['type'] = 'page'

        response = requests.post(
            f'{ctfd_url}/api/v1/files',
            headers=upload_headers,
            files=files,
            data=form_data
        )

    if response.status_code == 200:
        file_data = response.json()['data']
        if file_data and len(file_data) > 0:
            return file_data[0].get('location', '')

    print(f"  ❌ Failed to upload {file_path.name}: {response.status_code}")
    return None


def get_description_image_html(challenge_dir, image_filename):
    """
    Return HTML for challenge description image.
    Images are already in the theme static dir via git.
    """
    challenge_name = challenge_dir.name
    ext = Path(image_filename).suffix
    static_filename = f'{challenge_name}{ext}'

    img_url = f'/themes/cybernoir/static/img/challenges/{static_filename}'
    return f'<div style="text-align: center; margin-bottom: 15px;"><img src="{img_url}" alt="" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #4a90a4;"></div>\n\n'


def upload_challenge_files(challenge_dir, files_list, ctfd_url, headers, challenge_id):
    """
    Upload challenge files (for participants to download).
    """
    for file_rel_path in files_list:
        # Skip description images (challenge.png/jpg/jpeg etc.)
        if Path(file_rel_path).stem == 'challenge':
            print(f"  ⏭️  Skipped description image: {file_rel_path}")
            continue
        file_path = challenge_dir / file_rel_path
        if file_path.exists():
            location = upload_file(file_path, ctfd_url, headers, challenge_id)
            if location:
                print(f"  ✅ File uploaded: {file_rel_path}")
        else:
            print(f"  ⚠️  File not found: {file_rel_path}")


def create_challenge_api(data, description, ctfd_url, headers, challenge_dir=None):
    """
    Create a challenge via CTFd API.
    Returns challenge_id or None.
    """
    challenge_type = data.get('type', 'dynamic')
    extra = data.get('extra', {})

    payload = {
        'name': data['name'],
        'category': data['category'],
        'description': description,
        'value': data.get('value', 100),
        'type': challenge_type,
        'state': data.get('state', 'visible'),
        'max_attempts': data.get('max_attempts', 0),
        'attribution': data.get('author', ''),  # Map author to attribution for byline display
    }

    # Dynamic scoring fields
    if challenge_type in ['dynamic', 'firstblood']:
        payload['initial'] = extra.get('initial', data.get('value', 100))
        payload['decay'] = extra.get('decay', 20)
        payload['minimum'] = extra.get('minimum', 50)

    # FirstBlood specific
    if challenge_type == 'firstblood':
        first_blood_bonus = data.get('first_blood_bonus', [])
        for i, bonus in enumerate(first_blood_bonus):
            payload[f'first_blood_bonus[{i}]'] = bonus

    # Container specific
    if challenge_type == 'container':
        # Override image with local registry: REGISTRY/challenge-dir-name:latest
        registry = os.environ.get('DOCKER_REGISTRY', 'ghcr.io/mehdi-zen/nhk26')
        challenge_dir_name = Path(challenge_dir).name if challenge_dir else ''
        image_name = challenge_dir_name.lower().replace(' ', '-')
        payload['image'] = f'{registry}/{image_name}:latest'
        payload['port'] = data.get('port', 80)
        payload['connection_type'] = data.get('protocol', 'web')
        payload['connection_info'] = 'Container'
        payload['initial'] = extra.get('initial', data.get('value', 100))
        payload['decay'] = extra.get('decay', 20)
        payload['minimum'] = extra.get('minimum', 50)

        # Flag handling for container
        flags = data.get('flags', [])
        if flags:
            flag_content = flags[0] if isinstance(flags[0], str) else flags[0].get('flag', flags[0].get('content', ''))
            flag_prefix = flag_content.rsplit('}', 1)[0] if '}' in flag_content else flag_content
            flag_suffix = '}' if '}' in flag_content else ''
            payload['flag_mode'] = 'static'
            payload['flag_prefix'] = flag_prefix
            payload['flag_suffix'] = flag_suffix

    # Connection info (for non-container with external server)
    if data.get('connection_info') and challenge_type != 'container':
        payload['connection_info'] = data['connection_info']

    response = requests.post(f'{ctfd_url}/api/v1/challenges', headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()['data']['id']
    else:
        print(f"  ❌ Failed to create challenge: {response.status_code} - {response.text}")
        return None


def add_flags(data, challenge_id, ctfd_url, headers):
    """Add flags to a challenge."""
    flags = data.get('flags', [])
    for flag in flags:
        if isinstance(flag, str):
            flag_content = flag
            flag_type = 'static'
        else:
            flag_content = flag.get('flag', flag.get('content', ''))
            flag_type = flag.get('type', 'static')

        flag_payload = {
            'challenge_id': challenge_id,
            'content': flag_content,
            'type': flag_type
        }
        requests.post(f'{ctfd_url}/api/v1/flags', headers=headers, json=flag_payload)


def add_tags(data, challenge_id, ctfd_url, headers):
    """Add tags to a challenge."""
    tags = data.get('tags', [])
    for tag in tags:
        tag_payload = {'challenge_id': challenge_id, 'value': tag}
        requests.post(f'{ctfd_url}/api/v1/tags', headers=headers, json=tag_payload)


def add_hints(data, challenge_id, ctfd_url, headers):
    """Add hints to a challenge."""
    hints = data.get('hints', [])
    for hint in hints:
        if isinstance(hint, str):
            hint_content = hint
            hint_cost = 0
        else:
            hint_content = hint.get('content', '')
            hint_cost = hint.get('cost', 0)

        hint_payload = {
            'challenge_id': challenge_id,
            'content': hint_content,
            'cost': hint_cost
        }
        requests.post(f'{ctfd_url}/api/v1/hints', headers=headers, json=hint_payload)


def get_challenge_id_by_name(name, ctfd_url, headers, deployed_challenges=None):
    """Get challenge ID by name. Search deployed challenges first, then API."""
    if deployed_challenges:
        for c in deployed_challenges:
            if c['name'] == name:
                return c['id']
    response = requests.get(f'{ctfd_url}/api/v1/challenges?view=admin', headers=headers)
    if response.status_code == 200:
        challenges = response.json().get('data', [])
        for c in challenges:
            if c['name'] == name:
                return c['id']
    return None


def set_requirements(challenge_id, requirements, ctfd_url, headers, deployed_challenges=None):
    """Set prerequisites for a challenge."""
    prereqs = requirements.get('prerequisites', [])
    if not prereqs:
        return

    prereq_ids = []
    for prereq_name in prereqs:
        prereq_id = get_challenge_id_by_name(prereq_name, ctfd_url, headers, deployed_challenges)
        if prereq_id:
            prereq_ids.append(prereq_id)
        else:
            print(f"  ⚠️  Prerequisite not found: {prereq_name}")

    if prereq_ids:
        payload = {
            'requirements': {
                'prerequisites': prereq_ids
            }
        }
        response = requests.patch(
            f'{ctfd_url}/api/v1/challenges/{challenge_id}',
            headers=headers,
            json=payload
        )
        if response.status_code == 200:
            print(f"  ✅ Requirements set: {prereqs}")
        else:
            print(f"  ❌ Failed to set requirements: {response.status_code}")


def set_next_challenge(challenge_id, next_name, ctfd_url, headers, deployed_challenges=None):
    """Set the next challenge (redirect after solve)."""
    next_id = get_challenge_id_by_name(next_name, ctfd_url, headers, deployed_challenges)
    if not next_id:
        print(f"  ⚠️  Next challenge not found: {next_name}")
        return

    payload = {'next_id': next_id}
    response = requests.patch(
        f'{ctfd_url}/api/v1/challenges/{challenge_id}',
        headers=headers,
        json=payload
    )
    if response.status_code == 200:
        print(f"  ✅ Next challenge set: {next_name}")
    else:
        print(f"  ❌ Failed to set next challenge: {response.status_code}")


def deploy_challenge(challenge_dir, ctfd_url, ctfd_token):
    """Deploy a single challenge."""
    challenge_yml = challenge_dir / 'challenge.yml'

    # Skip templates directory
    if challenge_dir.name.startswith('_'):
        return None

    if not challenge_yml.exists():
        print(f"⚠️  No challenge.yml in {challenge_dir}")
        return False

    with open(challenge_yml, 'r') as f:
        data = yaml.safe_load(f)

    challenge_type = data.get('type', 'dynamic')
    print(f"\n==== Deploying: {data['name']} ({challenge_type}) ====")

    headers = {
        'Authorization': f'Token {ctfd_token}',
        'Content-Type': 'application/json'
    }

    # Prepare description with image
    description = data.get('description') or ''
    description_image = data.get('description_image')

    if description_image:
        img_html = get_description_image_html(challenge_dir, description_image)
        description = img_html + description

    # Create challenge
    challenge_id = create_challenge_api(data, description, ctfd_url, headers, challenge_dir)

    if not challenge_id:
        return {'success': False}

    print(f"  ✅ Challenge created (ID: {challenge_id})")

    # Add flags (for non-container challenges, container handles flags differently)
    if challenge_type != 'container':
        add_flags(data, challenge_id, ctfd_url, headers)
        print(f"  ✅ Flags added")

    # Add tags
    add_tags(data, challenge_id, ctfd_url, headers)
    print(f"  ✅ Tags added")

    # Add hints
    if data.get('hints'):
        add_hints(data, challenge_id, ctfd_url, headers)
        print(f"  ✅ Hints added")

    # Upload challenge files: auto-detect from files/ directory
    files_dir = challenge_dir / 'files'
    if files_dir.is_dir():
        files_list = [
            f'files/{f.name}' for f in sorted(files_dir.iterdir())
            if f.is_file() and f.stem != 'challenge'
        ]
        if files_list:
            print(f"  Uploading {len(files_list)} file(s)...")
            upload_challenge_files(challenge_dir, files_list, ctfd_url, headers, challenge_id)

    # Return challenge info for requirements and next processing
    return {
        'success': True,
        'id': challenge_id,
        'name': data['name'],
        'requirements': data.get('requirements'),
        'next': data.get('next')
    }


def main():
    """Deploy all challenges."""
    ctfd_url = os.environ.get('CTFD_URL')
    ctfd_token = os.environ.get('CTFD_TOKEN')

    if not ctfd_url or not ctfd_token:
        print("❌ Missing CTFD_URL or CTFD_TOKEN environment variables")
        return False

    challenges_dir = Path('challenges')
    success_count = 0
    fail_count = 0
    skip_count = 0
    deployed_challenges = []

    headers = {
        'Authorization': f'Token {ctfd_token}',
        'Content-Type': 'application/json'
    }

    # Sort challenges by difficulty (first tag) for display order in CTFd
    DIFFICULTY_ORDER = {'INTRO': 0, 'FACILE': 1, 'MOYEN': 2, 'DIFFICILE': 3, 'INSANE': 4}

    def get_difficulty(challenge_dir):
        yml = challenge_dir / 'challenge.yml'
        if not yml.exists():
            return 99
        try:
            with open(yml) as f:
                data = yaml.safe_load(f)
            tags = data.get('tags', [])
            if tags:
                first_tag = str(tags[0]).upper()
                return DIFFICULTY_ORDER.get(first_tag, 5)
        except Exception:
            pass
        return 99

    challenge_dirs = [d for d in challenges_dir.iterdir() if d.is_dir()]
    challenge_dirs.sort(key=lambda d: (get_difficulty(d), d.name))

    # First pass: deploy all challenges
    for challenge_dir in challenge_dirs:
        if challenge_dir.is_dir():
            result = deploy_challenge(challenge_dir, ctfd_url, ctfd_token)
            if result is None:
                skip_count += 1
            elif result is False or (isinstance(result, dict) and not result.get('success')):
                fail_count += 1
            elif isinstance(result, dict) and result.get('success'):
                success_count += 1
                deployed_challenges.append(result)

    # Second pass: set requirements (prerequisites)
    challenges_with_reqs = [c for c in deployed_challenges if c.get('requirements')]
    if challenges_with_reqs:
        print(f"\n==== Setting requirements ({len(challenges_with_reqs)} challenges) ====")
        for challenge in challenges_with_reqs:
            print(f"  {challenge['name']}:")
            set_requirements(challenge['id'], challenge['requirements'], ctfd_url, headers, deployed_challenges)

    # Third pass: set next challenge links
    challenges_with_next = [c for c in deployed_challenges if c.get('next')]
    if challenges_with_next:
        print(f"\n==== Setting next challenge links ({len(challenges_with_next)} challenges) ====")
        for challenge in challenges_with_next:
            print(f"  {challenge['name']}:")
            set_next_challenge(challenge['id'], challenge['next'], ctfd_url, headers, deployed_challenges)

    # Fourth pass: set warmup as prerequisite for all non-warmup challenges
    WARMUP_NAME = "J'ai lu la doc (ou pas)"
    warmup_id = get_challenge_id_by_name(WARMUP_NAME, ctfd_url, headers, deployed_challenges)
    if warmup_id:
        non_warmup = [c for c in deployed_challenges if c['name'] != WARMUP_NAME and not c.get('requirements')]
        if non_warmup:
            print(f"\n==== Setting warmup prerequisite ({len(non_warmup)} challenges) ====")
            for challenge in non_warmup:
                payload = {
                    'requirements': {
                        'prerequisites': [warmup_id]
                    }
                }
                response = requests.patch(
                    f'{ctfd_url}/api/v1/challenges/{challenge["id"]}',
                    headers=headers,
                    json=payload
                )
                if response.status_code == 200:
                    print(f"  ✅ {challenge['name']}")
                else:
                    print(f"  ❌ {challenge['name']}: {response.status_code}")
    else:
        print(f"\n⚠️  Warmup challenge '{WARMUP_NAME}' not found, skipping prerequisites")

    print(f"\n{'='*50}")
    print(f"✅ Deployed: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"⏭️  Skipped: {skip_count}")
    print(f"{'='*50}")

    return fail_count == 0


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
