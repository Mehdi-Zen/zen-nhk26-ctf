#!/usr/bin/env python3
"""
Validate CTF challenge manifests (challenge.yml files)
"""
import yaml
import sys
from pathlib import Path


def validate_challenges(challenges_dir='challenges'):
    """Validate all challenge.yml files in the challenges directory"""
    errors = []
    challenges = []
    
    # Find all challenge.yml files
    for yml in Path(challenges_dir).rglob('challenge.yml'):
        try:
            with open(yml) as f:
                data = yaml.safe_load(f)
            
            # Required base fields
            required = ['name', 'category', 'description', 'type']
            missing = [field for field in required if field not in data]
            
            if missing:
                errors.append(f"{yml}: Missing fields: {', '.join(missing)}")
            
            # Validation by challenge type
            challenge_type = data.get('type')
            
            if challenge_type == 'standard':
                # Standard challenges need 'value' and 'function'
                if 'value' not in data:
                    errors.append(f"{yml}: Standard challenge missing 'value' field")
                if 'function' not in data:
                    errors.append(f"{yml}: Standard challenge missing 'function' field")
            
            elif challenge_type == 'dynamic':
                # Dynamic challenges need 'value' and 'extra' with initial/minimum/decay
                if 'value' not in data:
                    errors.append(f"{yml}: Dynamic challenge missing 'value' field")
                if 'extra' not in data:
                    errors.append(f"{yml}: Dynamic challenge missing 'extra' section")
                else:
                    extra = data['extra']
                    dynamic_required = ['initial', 'minimum', 'decay']
                    missing_dynamic = [field for field in dynamic_required if field not in extra]
                    if missing_dynamic:
                        errors.append(f"{yml}: Dynamic challenge missing extra fields: {', '.join(missing_dynamic)}")
            
            elif challenge_type == 'container':
                # Container challenges need 'value', 'image', 'port'
                if 'value' not in data:
                    errors.append(f"{yml}: Container challenge missing 'value' field")
                if 'image' not in data:
                    errors.append(f"{yml}: Container challenge missing 'image' field")
                if 'port' not in data:
                    errors.append(f"{yml}: Container challenge missing 'port' field")
            
            challenges.append(str(yml))
            print(f"✓ {yml}: Valid ({challenge_type})")
            
        except yaml.YAMLError as e:
            errors.append(f"{yml}: YAML parsing error - {e}")
        except Exception as e:
            errors.append(f"{yml}: Error - {e}")
    
    if errors:
        print("\n❌ Validation errors found:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print(f"\n✅ All {len(challenges)} challenge manifests are valid!")
        return True


if __name__ == '__main__':
    success = validate_challenges()
    sys.exit(0 if success else 1)
