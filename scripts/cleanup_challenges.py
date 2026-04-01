#!/usr/bin/env python3
"""
Cleanup existing challenges from CTFd instance before redeployment
"""
import requests
import sys
import os
import time


def get_all_challenges(ctfd_url, headers):
    """Get all challenges with pagination support (including hidden)"""
    all_challenges = []
    page = 1

    while True:
        response = requests.get(
            f'{ctfd_url}/api/v1/challenges',
            headers=headers,
            params={'page': page, 'view': 'admin'}  # admin view includes hidden challenges
        )

        if response.status_code != 200:
            print(f"⚠️  Failed to retrieve challenges page {page}: {response.status_code}")
            break

        data = response.json()
        challenges = data.get('data', [])

        if not challenges:
            break

        all_challenges.extend(challenges)

        # Check if there are more pages
        meta = data.get('meta', {})
        pagination = meta.get('pagination', {})
        total_pages = pagination.get('pages', 1)

        if page >= total_pages:
            break

        page += 1

    return all_challenges


def cleanup_challenges(ctfd_url, ctfd_token):
    """Delete all existing challenges"""
    headers = {
        'Authorization': f'Token {ctfd_token}',
        'Content-Type': 'application/json'
    }

    # Get all challenges (with pagination, including hidden)
    challenges = get_all_challenges(ctfd_url, headers)
    print(f"Found {len(challenges)} existing challenges (including hidden)")

    if len(challenges) == 0:
        print("✅ No challenges to clean up")
        return True

    deleted_count = 0
    failed = []

    for challenge in challenges:
        challenge_id = challenge['id']
        challenge_name = challenge['name']
        print(f"  Deleting challenge {challenge_id}: {challenge_name}")

        delete_response = requests.delete(
            f'{ctfd_url}/api/v1/challenges/{challenge_id}',
            headers=headers
        )

        if delete_response.status_code == 200:
            print(f"    ✅ Deleted successfully")
            deleted_count += 1
        else:
            print(f"    ⚠️  Failed to delete: {delete_response.status_code} - {delete_response.text}")
            failed.append((challenge_id, challenge_name))

    # Retry failed deletions
    if failed:
        print(f"\n🔄 Retrying {len(failed)} failed deletions...")
        time.sleep(2)

        for challenge_id, challenge_name in failed:
            print(f"  Retry deleting {challenge_id}: {challenge_name}")
            delete_response = requests.delete(
                f'{ctfd_url}/api/v1/challenges/{challenge_id}',
                headers=headers
            )
            if delete_response.status_code == 200:
                print(f"    ✅ Deleted on retry")
                deleted_count += 1
            else:
                print(f"    ❌ Still failed: {delete_response.status_code}")

    # Wait for cleanup to complete
    if deleted_count > 0:
        print(f"\n⏳ Waiting 3 seconds for cleanup to complete...")
        time.sleep(3)

    # Clean up submissions, solves, awards, unlocks
    print("\n==== Cleaning up scores & history ====")
    for endpoint in ['submissions', 'awards', 'unlocks']:
        page = 1
        while True:
            resp = requests.get(
                f'{ctfd_url}/api/v1/{endpoint}',
                headers=headers,
                params={'page': page}
            )
            if resp.status_code != 200:
                break
            items = resp.json().get('data', [])
            if not items:
                break
            for item in items:
                requests.delete(
                    f'{ctfd_url}/api/v1/{endpoint}/{item["id"]}',
                    headers=headers
                )
            meta = resp.json().get('meta', {}).get('pagination', {})
            if page >= meta.get('pages', 1):
                break
            page += 1
        print(f"  ✅ {endpoint} cleaned")

    # Verify no challenges remain
    remaining = get_all_challenges(ctfd_url, headers)
    if len(remaining) == 0:
        print(f"✅ All {deleted_count} challenges deleted successfully")
        return True
    else:
        print(f"⚠️  WARNING: {len(remaining)} challenges still exist:")
        for ch in remaining:
            print(f"    - {ch['id']}: {ch['name']}")
        return False


if __name__ == '__main__':
    ctfd_url = os.environ.get('CTFD_URL')
    ctfd_token = os.environ.get('CTFD_TOKEN')

    if not ctfd_url or not ctfd_token:
        print("❌ Missing CTFD_URL or CTFD_TOKEN environment variables")
        sys.exit(1)

    success = cleanup_challenges(ctfd_url, ctfd_token)
    sys.exit(0 if success else 1)
