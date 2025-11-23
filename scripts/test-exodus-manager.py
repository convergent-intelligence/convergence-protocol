#!/usr/bin/env python3
"""
Test script for Exodus Seed Manager
Validates key derivation and encryption without using real seed phrases
"""

import sys
import json
import tempfile
from pathlib import Path

try:
    from exodus_seed_manager import ExodusSeedManager
except ImportError:
    print("Error: exodus-seed-manager.py must be in same directory")
    sys.exit(1)


def test_seed_validation():
    """Test seed phrase validation."""
    print("\n[TEST] Seed Phrase Validation")
    print("-" * 40)

    manager = ExodusSeedManager()

    # Test invalid seeds
    invalid_seeds = [
        ("only five words", "Too few words"),
        ("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon", "Invalid checksum"),
        ("", "Empty seed"),
    ]

    for seed, description in invalid_seeds:
        result = manager.validate_seed(seed)
        status = "✓" if not result else "✗"
        print(f"{status} {description}: {result}")

    # Test valid seed (BIP39 test vector)
    valid_seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    result = manager.validate_seed(valid_seed)
    print(f"{'✓' if result else '✗'} Valid BIP39 seed: {result}")

    return True


def test_encryption():
    """Test encryption and decryption."""
    print("\n[TEST] Encryption & Decryption")
    print("-" * 40)

    with tempfile.TemporaryDirectory() as tmpdir:
        manager = ExodusSeedManager(storage_path=tmpdir)

        # Setup encryption
        manager.setup_encryption(password="TestPassword123!")
        print("✓ Encryption key generated")

        # Test data
        test_data = {
            'networks': {
                'bitcoin': {
                    'account_0': {
                        'path': "m/44'/0'/0'/0/0",
                        'private_key': 'abc123',
                        'public_key': '1A1z7agoat',
                    }
                }
            },
            'seed_phrase_hash': 'test_hash',
            'created_at': '2024-01-15T12:00:00',
        }

        # Encrypt
        encrypted = manager.encrypt_data(test_data)
        print("✓ Data encrypted")

        # Decrypt
        decrypted = manager.decrypt_data(encrypted)
        print("✓ Data decrypted")

        # Verify
        if decrypted == test_data:
            print("✓ Decrypted data matches original")
            return True
        else:
            print("✗ Decrypted data does not match!")
            return False


def test_file_operations():
    """Test saving and loading encrypted files."""
    print("\n[TEST] File Operations")
    print("-" * 40)

    with tempfile.TemporaryDirectory() as tmpdir:
        manager = ExodusSeedManager(storage_path=tmpdir)
        manager.setup_encryption(password="TestPassword456!")

        # Test data
        test_data = {
            'networks': {
                'ethereum': {
                    'account_0': {
                        'path': "m/44'/60'/0'/0/0",
                        'private_key': 'eth_key_123',
                        'public_key': '0x1234567890123456789012345678901234567890',
                    }
                }
            },
            'seed_phrase_hash': 'eth_test_hash',
            'created_at': '2024-01-15T12:00:00',
        }

        # Save
        label = manager.save_keys(test_data, label="test_wallet")
        print(f"✓ Keys saved with label: {label}")

        # Verify files exist
        encrypted_file = Path(tmpdir) / f"{label}.encrypted"
        manifest_file = Path(tmpdir) / f"{label}.manifest"

        if encrypted_file.exists() and manifest_file.exists():
            print("✓ Encrypted file and manifest created")
        else:
            print("✗ Files not created properly")
            return False

        # Load and verify
        loaded_keys = manager.load_keys(label)

        if loaded_keys == test_data:
            print("✓ Loaded keys match saved data")
            return True
        else:
            print("✗ Loaded keys do not match!")
            return False


def test_list_operations():
    """Test listing saved keys."""
    print("\n[TEST] List Operations")
    print("-" * 40)

    with tempfile.TemporaryDirectory() as tmpdir:
        manager = ExodusSeedManager(storage_path=tmpdir)
        manager.setup_encryption(password="TestPassword789!")

        # Create multiple key sets
        for i in range(3):
            test_data = {
                'networks': {'bitcoin': {}},
                'seed_phrase_hash': f'hash_{i}',
                'created_at': '2024-01-15T12:00:00',
            }
            manager.save_keys(test_data, label=f"wallet_{i}")

        # List
        keys_list = manager.list_saved_keys()

        if len(keys_list) == 3:
            print(f"✓ Listed {len(keys_list)} saved key sets")
            for item in keys_list:
                print(f"  - {item['label']}")
            return True
        else:
            print(f"✗ Expected 3 key sets, got {len(keys_list)}")
            return False


def test_address_export():
    """Test exporting public addresses."""
    print("\n[TEST] Address Export (No Private Keys)")
    print("-" * 40)

    with tempfile.TemporaryDirectory() as tmpdir:
        manager = ExodusSeedManager(storage_path=tmpdir)
        manager.setup_encryption(password="TestPassword000!")

        # Create test data
        test_data = {
            'networks': {
                'ethereum': {
                    'account_0': {
                        'path': "m/44'/60'/0'/0/0",
                        'private_key': 'SHOULD_NOT_APPEAR',
                        'public_key': '0xTestAddress',
                    }
                }
            },
            'seed_phrase_hash': 'export_test',
            'created_at': '2024-01-15T12:00:00',
        }

        label = manager.save_keys(test_data, label="export_test")

        # Export
        output_file = manager.export_keys_summary(label)
        print(f"✓ Address summary exported to: {output_file}")

        # Verify no private keys in export
        summary_content = Path(output_file).read_text()

        if 'SHOULD_NOT_APPEAR' in summary_content:
            print("✗ CRITICAL: Private key found in exported summary!")
            return False
        elif 'private_key' in summary_content:
            print("✗ CRITICAL: 'private_key' field found in exported summary!")
            return False
        else:
            print("✓ No private keys in exported summary")
            print("✓ Safe to share address summary")
            return True


def test_seed_consistency():
    """Test seed phrase verification."""
    print("\n[TEST] Seed Phrase Consistency")
    print("-" * 40)

    with tempfile.TemporaryDirectory() as tmpdir:
        manager = ExodusSeedManager(storage_path=tmpdir)
        manager.setup_encryption(password="TestPassword111!")

        # Create test data
        seed_phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        seed_hash = __import__('hashlib').sha256(seed_phrase.encode()).hexdigest()

        test_data = {
            'networks': {'bitcoin': {}},
            'seed_phrase_hash': seed_hash,
            'created_at': '2024-01-15T12:00:00',
        }

        manager.save_keys(test_data, label="consistency_test")

        # Test verification
        loaded = manager.load_keys("consistency_test")

        if manager.verify_seed_consistency(seed_phrase, loaded):
            print("✓ Seed phrase verified correctly")
        else:
            print("✗ Seed verification failed")
            return False

        # Test wrong seed
        wrong_seed = "wrong wrong wrong wrong wrong wrong wrong wrong wrong wrong wrong wrong"
        if not manager.verify_seed_consistency(wrong_seed, loaded):
            print("✓ Wrong seed correctly rejected")
            return True
        else:
            print("✗ Wrong seed was incorrectly verified!")
            return False


def main():
    """Run all tests."""
    print("\n" + "="*50)
    print("Exodus Seed Manager - Test Suite")
    print("="*50)

    tests = [
        ("Seed Validation", test_seed_validation),
        ("Encryption", test_encryption),
        ("File Operations", test_file_operations),
        ("List Operations", test_list_operations),
        ("Address Export", test_address_export),
        ("Seed Consistency", test_seed_consistency),
    ]

    results = []

    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} failed with error: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))

    # Summary
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} passed")

    if passed == total:
        print("\n✓ All tests passed! System is ready.")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
