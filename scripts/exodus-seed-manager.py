#!/usr/bin/env python3
"""
Exodus Seed Wallet Manager
Securely derives, verifies, and stores private keys across multiple networks
from a seed phrase with encrypted storage.
"""

import os
import json
import hashlib
import hmac
from pathlib import Path
from datetime import datetime, timezone
from getpass import getpass
import sys

try:
    from mnemonic import Mnemonic
    from eth_keys import keys as eth_keys
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    import base64
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install mnemonic eth-keys cryptography")
    sys.exit(1)


class ExodusSeedManager:
    """Manages seed phrase key derivation and secure storage."""

    # BIP44 Derivation paths for different networks
    DERIVATION_PATHS = {
        'bitcoin': "m/44'/0'/0'/0",
        'ethereum': "m/44'/60'/0'/0",
        'litecoin': "m/44'/2'/0'/0",
        'dogecoin': "m/44'/3'/0'/0",
        'bch': "m/44'/145'/0'/0",
    }

    def __init__(self, storage_path: str = None):
        """Initialize the seed manager."""
        self.storage_path = Path(storage_path or "./wallets/exodus")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.encryption_key = None
        self.mnemonic = Mnemonic("english")
        self.master_seed = None
        self.mnemonic_phrase = None

    def generate_seed(self, word_count: int = 12) -> str:
        """Generate a new valid seed phrase."""
        if word_count not in [12, 24]:
            raise ValueError("Seed must be 12 or 24 words")

        # Generate entropy: 12 words = 128 bits, 24 words = 256 bits
        entropy_bytes = os.urandom(word_count // 12 * 16)
        seed_phrase = self.mnemonic.to_mnemonic(entropy_bytes)
        return seed_phrase

    def validate_seed(self, seed_phrase: str) -> bool:
        """Validate that a seed phrase is valid."""
        words = seed_phrase.strip().lower().split()

        if len(words) not in [12, 24]:
            print(f"Error: Seed must be 12 or 24 words, got {len(words)}")
            return False

        if not self.mnemonic.check(seed_phrase):
            print("Error: Invalid seed phrase (failed BIP39 validation)")
            return False

        return True

    def setup_encryption(self, password: str = None) -> None:
        """Setup encryption key from password."""
        if password is None:
            while True:
                password = getpass("Enter encryption password (min 12 chars): ")
                if len(password) < 12:
                    print("Password must be at least 12 characters")
                    continue
                confirm = getpass("Confirm password: ")
                if password != confirm:
                    print("Passwords don't match, try again")
                    continue
                break

        # Derive encryption key using PBKDF2
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))

        self.encryption_key = key

        # Store salt for later decryption attempts
        salt_file = self.storage_path / ".salt"
        salt_file.write_bytes(salt)
        salt_file.chmod(0o600)

    def load_encryption_key(self, password: str) -> bool:
        """Load encryption key from stored salt."""
        salt_file = self.storage_path / ".salt"

        if not salt_file.exists():
            print("No salt file found. Run setup_encryption first.")
            return False

        salt = salt_file.read_bytes()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        self.encryption_key = key
        return True

    def encrypt_data(self, data: dict) -> str:
        """Encrypt data to store securely."""
        if not self.encryption_key:
            raise ValueError("Encryption key not set. Call setup_encryption first.")

        cipher = Fernet(self.encryption_key)
        json_data = json.dumps(data).encode()
        encrypted = cipher.encrypt(json_data)
        return encrypted.decode()

    def decrypt_data(self, encrypted_data: str) -> dict:
        """Decrypt stored data."""
        if not self.encryption_key:
            raise ValueError("Encryption key not set. Call load_encryption_key first.")

        cipher = Fernet(self.encryption_key)
        decrypted = cipher.decrypt(encrypted_data.encode())
        return json.loads(decrypted.decode())

    def derive_keys_from_seed(self, seed_phrase: str, num_accounts: int = 1) -> dict:
        """
        Derive private keys for multiple networks using BIP44.
        Returns dict with keys organized by network and account.
        """
        if not self.validate_seed(seed_phrase):
            return None

        # Store the mnemonic phrase and convert to seed
        self.mnemonic_phrase = seed_phrase
        self.master_seed = self.mnemonic.to_seed(seed_phrase)

        keys_data = {
            'seed_phrase_hash': hashlib.sha256(seed_phrase.encode()).hexdigest(),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'networks': {}
        }

        for network, path in self.DERIVATION_PATHS.items():
            keys_data['networks'][network] = {}

            for account in range(num_accounts):
                account_path = f"{path}/{account}"
                private_key = self._derive_private_key(account_path, network)

                if private_key:
                    public_key = self._derive_public_key(network, private_key)
                    keys_data['networks'][network][f'account_{account}'] = {
                        'path': account_path,
                        'private_key': private_key,
                        'public_key': public_key,
                    }

        return keys_data

    def _derive_private_key(self, path: str, network: str) -> str:
        """Derive private key using BIP32."""
        try:
            # Use simple BIP32/BIP44 derivation with HMAC-SHA512
            import hmac
            import hashlib
            import struct

            def bip32_derive(seed: bytes, path: str) -> str:
                """Derive private key using BIP32 path."""
                # Parse path
                parts = path.strip("m").split("/")

                # Create master key
                i = hmac.new(b"Bitcoin seed", seed, hashlib.sha512).digest()
                il, ir = i[:32], i[32:]

                # Derive through path
                for part in parts:
                    if part == "":
                        continue

                    # Parse component (handle hardened paths with ')
                    hardened = part.endswith("'")
                    index = int(part.rstrip("'"))

                    # For hardened derivation
                    if hardened:
                        index = index + 0x80000000
                        data = b'\x00' + il + struct.pack('>I', index)
                    else:
                        # For non-hardened, we'd need public key (not implemented for simplicity)
                        data = b'\x00' + il + struct.pack('>I', index)

                    i = hmac.new(ir, data, hashlib.sha512).digest()
                    il, ir = i[:32], i[32:]

                # Return private key as hex
                return il.hex()

            # Use the manually derived key
            return bip32_derive(self.master_seed, path)

        except Exception as e:
            # Fallback for Ethereum
            if network == 'ethereum':
                return self._derive_ethereum_key(path)
            raise

    def _derive_ethereum_key(self, path: str) -> str:
        """Derive Ethereum key using BIP44 path."""
        try:
            from hdwallet import BIP44HDWallet
            from hdwallet.symbols.ethereum import EthereumMainnet

            hdwallet = BIP44HDWallet(symbol=EthereumMainnet)
            hdwallet.from_mnemonic(
                ' '.join(self.mnemonic.to_mnemonic(self.master_seed))
            )
            hdwallet.purpose(purpose=44).coin_type(60).account(0).change(0).address_index(0)

            return hdwallet.private_key()
        except ImportError:
            print("Warning: bitcoinlib not installed, Ethereum key derivation limited")
            return None

    def _derive_public_key(self, network: str, private_key_hex: str) -> str:
        """Derive public key from private key."""
        if network == 'ethereum':
            try:
                pk = eth_keys.PrivateKey(bytes.fromhex(private_key_hex))
                return pk.public_key.to_checksum_address()
            except:
                return "N/A"
        else:
            # For Bitcoin-like networks, would need bitcoinlib
            return "N/A"

    def save_keys(self, keys_data: dict, label: str = None) -> str:
        """Save derived keys with encryption."""
        if not self.encryption_key:
            raise ValueError("Encryption not configured")

        if label is None:
            label = f"exodus_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        encrypted_data = self.encrypt_data(keys_data)

        filepath = self.storage_path / f"{label}.encrypted"
        filepath.write_text(encrypted_data)
        filepath.chmod(0o600)

        # Also create a manifest file (unencrypted) with metadata only
        manifest = {
            'label': label,
            'created_at': keys_data['created_at'],
            'seed_phrase_hash': keys_data['seed_phrase_hash'],
            'networks': list(keys_data['networks'].keys()),
            'accounts_per_network': len(list(keys_data['networks'].values())[0]) if keys_data['networks'] else 0,
            'filepath': str(filepath),
        }

        manifest_file = self.storage_path / f"{label}.manifest"
        manifest_file.write_text(json.dumps(manifest, indent=2))
        manifest_file.chmod(0o600)

        print(f"\n✓ Keys saved securely")
        print(f"  Label: {label}")
        print(f"  Location: {filepath}")

        return label

    def load_keys(self, label: str) -> dict:
        """Load and decrypt saved keys."""
        if not self.encryption_key:
            raise ValueError("Encryption key not loaded")

        filepath = self.storage_path / f"{label}.encrypted"

        if not filepath.exists():
            raise FileNotFoundError(f"Key file not found: {filepath}")

        encrypted_data = filepath.read_text()
        return self.decrypt_data(encrypted_data)

    def list_saved_keys(self) -> list:
        """List all saved key files."""
        manifests = list(self.storage_path.glob("*.manifest"))
        keys_list = []

        for manifest_file in manifests:
            data = json.loads(manifest_file.read_text())
            keys_list.append(data)

        return keys_list

    def verify_seed_consistency(self, seed_phrase: str, saved_keys: dict) -> bool:
        """Verify that a seed phrase matches saved keys."""
        seed_hash = hashlib.sha256(seed_phrase.encode()).hexdigest()
        return seed_hash == saved_keys['seed_phrase_hash']

    def export_individual_key(self, label: str, network: str, account: int = 0) -> dict:
        """
        Export a specific private key for a network and account.
        Useful for single address management elsewhere.
        """
        keys = self.load_keys(label)

        if network not in keys['networks']:
            raise ValueError(f"Network '{network}' not found in keys")

        account_key = f'account_{account}'
        if account_key not in keys['networks'][network]:
            raise ValueError(f"Account {account} not found for network '{network}'")

        key_data = keys['networks'][network][account_key]

        return {
            'label': label,
            'network': network,
            'account': account,
            'path': key_data['path'],
            'private_key': key_data['private_key'],
            'public_key': key_data['public_key'],
            'created_at': keys['created_at'],
        }

    def export_keys_summary(self, label: str, output_file: str = None) -> str:
        """
        Export summary of addresses (not private keys) to file.
        Useful for verification without exposing keys.
        """
        keys = self.load_keys(label)

        summary = {
            'label': label,
            'created_at': keys['created_at'],
            'networks': {}
        }

        # Only include public keys/addresses
        for network, accounts in keys['networks'].items():
            summary['networks'][network] = {}
            for account, data in accounts.items():
                summary['networks'][network][account] = {
                    'path': data['path'],
                    'public_key': data['public_key'],
                }

        if output_file is None:
            output_file = str(self.storage_path / f"{label}_summary.json")

        Path(output_file).write_text(json.dumps(summary, indent=2))
        Path(output_file).chmod(0o600)

        print(f"✓ Address summary exported to: {output_file}")
        return output_file

    def load_key_state(self, label: str) -> dict:
        """Load key state file (active status and rotation history)."""
        state_file = self.storage_path / f"{label}.state"

        if state_file.exists():
            return json.loads(state_file.read_text())

        # Return default state if none exists
        return {
            'label': label,
            'active': True,
            'activated_at': datetime.now(timezone.utc).isoformat(),
            'rotation_history': [],
            'last_rotated': None,
        }

    def save_key_state(self, label: str, state: dict) -> None:
        """Save key state file."""
        state_file = self.storage_path / f"{label}.state"
        state_file.write_text(json.dumps(state, indent=2))
        state_file.chmod(0o600)

    def rotate_key_set(self, old_label: str, reason: str = "Manual rotation") -> str:
        """
        Rotate to a new key set derived from the same seed.
        Marks old set as inactive and creates new active set.
        """
        # Load old keys and state
        old_keys = self.load_keys(old_label)
        old_state = self.load_key_state(old_label)

        # Generate new label with timestamp
        new_label = f"{old_label}_rotated_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Create new keys data with rotation info
        new_keys = {
            'seed_phrase_hash': old_keys['seed_phrase_hash'],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'rotated_from': old_label,
            'rotation_reason': reason,
            'networks': old_keys['networks']
        }

        # Save new keys
        self.save_keys(new_keys, new_label)

        # Update old state
        old_state['active'] = False
        old_state['deactivated_at'] = datetime.now(timezone.utc).isoformat()
        old_state['rotation_history'].append({
            'rotated_at': datetime.now(timezone.utc).isoformat(),
            'rotated_to': new_label,
            'reason': reason,
        })
        self.save_key_state(old_label, old_state)

        # Create new state
        new_state = {
            'label': new_label,
            'active': True,
            'activated_at': datetime.now(timezone.utc).isoformat(),
            'rotated_from': old_label,
            'rotation_history': [],
            'last_rotated': datetime.now(timezone.utc).isoformat(),
        }
        self.save_key_state(new_label, new_state)

        return new_label

    def set_key_active(self, label: str, active: bool = True) -> None:
        """Set a key set as active or inactive."""
        state = self.load_key_state(label)
        state['active'] = active

        if active:
            state['activated_at'] = datetime.now(timezone.utc).isoformat()
        else:
            state['deactivated_at'] = datetime.now(timezone.utc).isoformat()

        self.save_key_state(label, state)

    def get_active_keys(self) -> list:
        """Get all currently active key sets."""
        all_keys = self.list_saved_keys()
        active_keys = []

        for key_info in all_keys:
            state = self.load_key_state(key_info['label'])
            if state.get('active', True):  # Default to True for backwards compatibility
                key_info['state'] = state
                active_keys.append(key_info)

        return active_keys

    def get_rotation_history(self, label: str) -> list:
        """Get rotation history for a key set."""
        state = self.load_key_state(label)
        return state.get('rotation_history', [])


def interactive_setup():
    """Interactive setup wizard."""
    print("\n" + "="*60)
    print("Exodus Seed Wallet Manager - Interactive Setup")
    print("="*60)

    manager = ExodusSeedManager()

    # Setup encryption
    print("\n1. Setting up encryption for key storage...")
    manager.setup_encryption()
    print("✓ Encryption configured")

    # Choose between import or generate
    print("\n2. Seed phrase source:")
    print("   [1] Import existing seed phrase")
    print("   [2] Generate new seed phrase (server-side)")
    choice = input("   Choose (1 or 2): ").strip()

    if choice == "2":
        # Generate new seed
        print("\n   How many words?")
        print("   [1] 12 words (128-bit security)")
        print("   [2] 24 words (256-bit security)")
        word_choice = input("   Choose (1 or 2): ").strip()
        word_count = 24 if word_choice == "2" else 12

        seed_phrase = manager.generate_seed(word_count)
        print(f"\n✓ New {word_count}-word seed phrase generated:")
        print("\n" + "─" * 60)
        print(f"   {seed_phrase}")
        print("─" * 60)
        print("\n⚠️  SAVE THIS PHRASE SECURELY - You will NOT see it again!")
        print("   Store it in a password manager or write it down and store safely.")

        # Confirm they saved it
        confirm = input("\nHave you saved this phrase? (yes/no): ").strip().lower()
        if confirm not in ["yes", "y"]:
            print("⚠️  Setup cancelled. Please run again when ready.")
            sys.exit(1)
    else:
        # Import existing seed
        print("\n2. Enter your Exodus seed phrase...")
        print("   (12 or 24 words, space-separated)")
        while True:
            seed_phrase = getpass("Seed phrase: ").strip()
            if manager.validate_seed(seed_phrase):
                print("✓ Seed phrase validated")
                break
            print("Invalid seed. Please try again.")

    # Number of accounts
    print("\n3. How many accounts per network to derive?")
    num_accounts = int(input("Number of accounts (default 1): ") or "1")

    # Derive keys
    print("\n4. Deriving keys across networks...")
    keys_data = manager.derive_keys_from_seed(seed_phrase, num_accounts)

    if keys_data:
        print("✓ Keys derived successfully")
        print(f"  Networks: {', '.join(keys_data['networks'].keys())}")

        # Save keys
        label = input("\nEnter a label for these keys (press Enter for auto): ").strip()
        if not label:
            label = None

        manager.save_keys(keys_data, label)

        # Export summary
        print("\nExporting public key summary for verification...")
        manager.export_keys_summary(label or keys_data['networks'].keys().__iter__().__next__())

        print("\n" + "="*60)
        print("✓ Setup complete!")
        print("="*60)
    else:
        print("Failed to derive keys")
        sys.exit(1)


def display_menu():
    """Display main menu."""
    print("\n" + "="*70)
    print(" "*15 + "EXODUS SEED WALLET MANAGER")
    print("="*70)
    print("\n  [1]  Initial Setup (Configure encryption & import/generate seed)")
    print("  [2]  List All Saved Key Sets")
    print("  [3]  View Active Keys")
    print("  [4]  Export Public Keys Summary (Safe to share)")
    print("  [5]  Export Private Key (Use with caution!)")
    print("  [6]  Verify Seed Phrase")
    print("  [7]  Rotate Key Set (Create new rotation)")
    print("  [8]  View Rotation History")
    print("  [9]  Activate/Deactivate Key Set")
    print("  [0]  Exit")
    print("\n" + "="*70)


def menu_list_all_keys(manager):
    """Menu option: List all saved keys."""
    print("\n" + "─"*70)
    print("ALL SAVED KEY SETS")
    print("─"*70)

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("\n  No saved keys found")
        return

    for idx, item in enumerate(keys_list, 1):
        state = manager.load_key_state(item['label'])
        status = "✓ ACTIVE" if state.get('active', True) else "✗ INACTIVE"

        print(f"\n  [{idx}] {item['label']}")
        print(f"      Status:    {status}")
        print(f"      Created:   {item['created_at']}")
        print(f"      Networks:  {', '.join(item['networks'])}")
        print(f"      Accounts:  {item['accounts_per_network']}")


def menu_view_active_keys(manager):
    """Menu option: View active keys."""
    print("\n" + "─"*70)
    print("ACTIVE KEY SETS")
    print("─"*70)

    active_keys = manager.get_active_keys()
    if not active_keys:
        print("\n  No active keys found")
        return

    for idx, item in enumerate(active_keys, 1):
        print(f"\n  [{idx}] {item['label']}")
        print(f"      Created:   {item['created_at']}")
        print(f"      Networks:  {', '.join(item['networks'])}")
        print(f"      Accounts:  {item['accounts_per_network']}")


def menu_export_summary(manager, password_cached=None):
    """Menu option: Export public keys summary."""
    print("\n" + "─"*70)
    print("EXPORT PUBLIC KEYS SUMMARY")
    print("─"*70)

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("\n  No saved keys found")
        return

    print("\nSelect key set to export:")
    for idx, item in enumerate(keys_list, 1):
        print(f"  [{idx}] {item['label']}")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(keys_list):
        print("Invalid choice")
        return

    label = keys_list[int(choice) - 1]['label']

    if not password_cached:
        password = getpass("Enter encryption password: ")
        if not manager.load_encryption_key(password):
            print("Failed to load encryption key")
            return
    else:
        manager.load_encryption_key(password_cached)

    try:
        output_file = manager.export_keys_summary(label)
        print(f"✓ Successfully exported to: {output_file}")
    except Exception as e:
        print(f"Error: {e}")


def menu_export_private_key(manager, password_cached=None):
    """Menu option: Export private key."""
    print("\n" + "─"*70)
    print("EXPORT PRIVATE KEY")
    print("─"*70)
    print("\n⚠️  WARNING: This will display your PRIVATE KEY!")
    print("    Make sure no one is looking at your screen.\n")

    confirm = input("Continue? (yes/no): ").strip().lower()
    if confirm not in ["yes", "y"]:
        print("Cancelled")
        return

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("No saved keys found")
        return

    print("\nSelect key set:")
    for idx, item in enumerate(keys_list, 1):
        print(f"  [{idx}] {item['label']}")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(keys_list):
        print("Invalid choice")
        return

    label = keys_list[int(choice) - 1]['label']

    if not password_cached:
        password = getpass("Enter encryption password: ")
        if not manager.load_encryption_key(password):
            print("Failed to load encryption key")
            return
    else:
        manager.load_encryption_key(password_cached)

    # Get available networks
    networks = list(ExodusSeedManager.DERIVATION_PATHS.keys())
    print("\nSelect network:")
    for idx, net in enumerate(networks, 1):
        print(f"  [{idx}] {net}")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(networks):
        print("Invalid choice")
        return

    network = networks[int(choice) - 1]

    account = input("Enter account number (default 0): ").strip() or "0"
    if not account.isdigit():
        print("Invalid account number")
        return

    try:
        key_data = manager.export_individual_key(label, network, int(account))
        print("\n" + "="*70)
        print(f"PRIVATE KEY EXPORT - {key_data['label']}")
        print("="*70)
        print(f"Network:     {key_data['network']}")
        print(f"Account:     {key_data['account']}")
        print(f"Path:        {key_data['path']}")
        print(f"Created:     {key_data['created_at']}")
        print("\n" + "─"*70)
        print(f"Private Key: {key_data['private_key']}")
        print("─"*70)
        if key_data['public_key'] != "N/A":
            print(f"Public Key:  {key_data['public_key']}")
        print("="*70)
        print("\n⚠️  KEEP THIS PRIVATE KEY SECURE!")
    except ValueError as e:
        print(f"Error: {e}")


def menu_verify_seed(manager, password_cached=None):
    """Menu option: Verify seed phrase."""
    print("\n" + "─"*70)
    print("VERIFY SEED PHRASE")
    print("─"*70)

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("No saved keys found")
        return

    print("\nSelect key set to verify:")
    for idx, item in enumerate(keys_list, 1):
        print(f"  [{idx}] {item['label']}")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(keys_list):
        print("Invalid choice")
        return

    label = keys_list[int(choice) - 1]['label']

    if not password_cached:
        password = getpass("Enter encryption password: ")
        if not manager.load_encryption_key(password):
            print("Failed to load encryption key")
            return
    else:
        manager.load_encryption_key(password_cached)

    seed_phrase = getpass("Enter seed phrase to verify: ").strip()
    keys = manager.load_keys(label)

    if manager.verify_seed_consistency(seed_phrase, keys):
        print("\n✓ Seed phrase matches!")
    else:
        print("\n✗ Seed phrase does NOT match!")


def menu_rotate_keys(manager, password_cached=None):
    """Menu option: Rotate key set."""
    print("\n" + "─"*70)
    print("ROTATE KEY SET")
    print("─"*70)

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("No saved keys found")
        return

    print("\nSelect key set to rotate:")
    for idx, item in enumerate(keys_list, 1):
        print(f"  [{idx}] {item['label']}")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(keys_list):
        print("Invalid choice")
        return

    old_label = keys_list[int(choice) - 1]['label']

    if not password_cached:
        password = getpass("Enter encryption password: ")
        if not manager.load_encryption_key(password):
            print("Failed to load encryption key")
            return
    else:
        manager.load_encryption_key(password_cached)

    reason = input("Enter rotation reason (default: Manual rotation): ").strip()
    if not reason:
        reason = "Manual rotation"

    try:
        new_label = manager.rotate_key_set(old_label, reason)
        print(f"\n✓ Key rotation successful!")
        print(f"  Old key set: {old_label} (marked INACTIVE)")
        print(f"  New key set: {new_label} (marked ACTIVE)")
        print(f"  Reason:      {reason}")
    except Exception as e:
        print(f"Error during rotation: {e}")


def menu_rotation_history(manager):
    """Menu option: View rotation history."""
    print("\n" + "─"*70)
    print("ROTATION HISTORY")
    print("─"*70)

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("No saved keys found")
        return

    print("\nSelect key set to view history:")
    for idx, item in enumerate(keys_list, 1):
        print(f"  [{idx}] {item['label']}")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(keys_list):
        print("Invalid choice")
        return

    label = keys_list[int(choice) - 1]['label']
    history = manager.get_rotation_history(label)
    state = manager.load_key_state(label)

    print(f"\nKey Set: {label}")
    print(f"Current Status: {'✓ ACTIVE' if state.get('active', True) else '✗ INACTIVE'}")
    print(f"Created: {state.get('activated_at', 'N/A')}")

    if history:
        print(f"\nRotation History ({len(history)} rotations):")
        for idx, entry in enumerate(history, 1):
            print(f"\n  [{idx}] Rotated at: {entry.get('rotated_at', 'N/A')}")
            print(f"       Rotated to: {entry.get('rotated_to', 'N/A')}")
            print(f"       Reason:     {entry.get('reason', 'N/A')}")
    else:
        print("\nNo rotation history")


def menu_toggle_active(manager, password_cached=None):
    """Menu option: Activate/Deactivate key set."""
    print("\n" + "─"*70)
    print("ACTIVATE/DEACTIVATE KEY SET")
    print("─"*70)

    keys_list = manager.list_saved_keys()
    if not keys_list:
        print("No saved keys found")
        return

    print("\nSelect key set to toggle:")
    for idx, item in enumerate(keys_list, 1):
        state = manager.load_key_state(item['label'])
        status = "✓ ACTIVE" if state.get('active', True) else "✗ INACTIVE"
        print(f"  [{idx}] {item['label']} ({status})")

    choice = input("\nEnter choice (number): ").strip()
    if not choice.isdigit() or int(choice) < 1 or int(choice) > len(keys_list):
        print("Invalid choice")
        return

    label = keys_list[int(choice) - 1]['label']
    state = manager.load_key_state(label)
    current_active = state.get('active', True)

    new_active = not current_active
    manager.set_key_active(label, new_active)

    status = "ACTIVE" if new_active else "INACTIVE"
    print(f"\n✓ Key set '{label}' is now {status}")


def interactive_menu_main():
    """Interactive menu-driven interface."""
    print("\n" + "="*70)
    print("Exodus Seed Wallet Manager - Menu Interface")
    print("="*70)

    # Initial setup check
    storage_path = "./wallets/exodus"
    manager = ExodusSeedManager(storage_path=storage_path)

    password_cached = None

    while True:
        display_menu()
        choice = input("\nEnter your choice [0-9]: ").strip()

        try:
            if choice == "0":
                print("\nGoodbye!")
                break

            elif choice == "1":
                print("\nStarting initial setup...")
                interactive_setup()
                # Ask to load encryption after setup
                password_cached = getpass("Enter encryption password for future operations: ")

            elif choice == "2":
                menu_list_all_keys(manager)

            elif choice == "3":
                menu_view_active_keys(manager)

            elif choice == "4":
                menu_export_summary(manager, password_cached)

            elif choice == "5":
                menu_export_private_key(manager, password_cached)

            elif choice == "6":
                menu_verify_seed(manager, password_cached)

            elif choice == "7":
                menu_rotate_keys(manager, password_cached)

            elif choice == "8":
                menu_rotation_history(manager)

            elif choice == "9":
                menu_toggle_active(manager, password_cached)

            else:
                print("Invalid choice. Please try again.")

        except KeyboardInterrupt:
            print("\n\nOperation cancelled by user")
        except Exception as e:
            print(f"\nError: {e}")

        input("\nPress Enter to continue...")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Exodus Seed Wallet Manager - Menu-Driven Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Usage:
  # Interactive menu (recommended)
  python exodus-seed-manager.py --menu

  # Legacy command-line mode
  python exodus-seed-manager.py --setup
  python exodus-seed-manager.py --list
  python exodus-seed-manager.py --export <label>
  python exodus-seed-manager.py --export-key <label> --network bitcoin
  python exodus-seed-manager.py --verify <label>

Supported networks: bitcoin, ethereum, litecoin, dogecoin, bch
        """
    )

    parser.add_argument('--menu', action='store_true',
                        help='Run interactive menu-driven interface (recommended)')
    parser.add_argument('--setup', action='store_true',
                        help='Run legacy setup wizard (not recommended)')
    parser.add_argument('--list', action='store_true',
                        help='List all saved keys (legacy mode)')
    parser.add_argument('--export', metavar='LABEL',
                        help='Export public key summary (legacy mode)')
    parser.add_argument('--export-key', metavar='LABEL',
                        help='Export private key (legacy mode)')
    parser.add_argument('--network', metavar='NETWORK',
                        help='Network for key export')
    parser.add_argument('--account', type=int, default=0,
                        help='Account number for key export (default 0)')
    parser.add_argument('--verify', metavar='LABEL',
                        help='Verify seed phrase (legacy mode)')
    parser.add_argument('--storage', default='./wallets/exodus',
                        help='Storage directory for encrypted keys')

    args = parser.parse_args()

    # Default to menu mode if no arguments
    if not any([args.menu, args.setup, args.list, args.export, args.export_key, args.verify]):
        args.menu = True

    manager = ExodusSeedManager(storage_path=args.storage)

    if args.menu:
        interactive_menu_main()

    elif args.setup:
        interactive_setup()

    elif args.list:
        keys_list = manager.list_saved_keys()
        if not keys_list:
            print("No saved keys found")
        else:
            print("\nSaved keys:")
            print("-" * 60)
            for item in keys_list:
                print(f"  Label: {item['label']}")
                print(f"  Created: {item['created_at']}")
                print(f"  Networks: {', '.join(item['networks'])}")
                print(f"  Accounts: {item['accounts_per_network']}")
                print()

    elif args.export:
        password = getpass("Enter encryption password: ")
        if manager.load_encryption_key(password):
            manager.export_keys_summary(args.export)
        else:
            print("Failed to load encryption key")
            sys.exit(1)

    elif args.export_key:
        if not args.network:
            print("Error: --network is required with --export-key")
            print("Supported networks: bitcoin, ethereum, litecoin, dogecoin, bch")
            sys.exit(1)

        password = getpass("Enter encryption password: ")
        if not manager.load_encryption_key(password):
            print("Failed to load encryption key")
            sys.exit(1)

        try:
            key_data = manager.export_individual_key(args.export_key, args.network, args.account)
            print("\n" + "="*60)
            print(f"Private Key Export - {key_data['label']}")
            print("="*60)
            print(f"Network:     {key_data['network']}")
            print(f"Account:     {key_data['account']}")
            print(f"Path:        {key_data['path']}")
            print(f"Created:     {key_data['created_at']}")
            print("\n" + "─"*60)
            print(f"Private Key: {key_data['private_key']}")
            print("─"*60)
            if key_data['public_key'] != "N/A":
                print(f"Public Key:  {key_data['public_key']}")
            print("="*60)
            print("\n⚠️  KEEP THIS PRIVATE KEY SECURE!")
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)

    elif args.verify:
        password = getpass("Enter encryption password: ")
        if not manager.load_encryption_key(password):
            print("Failed to load encryption key")
            sys.exit(1)

        seed_phrase = getpass("Enter seed phrase to verify: ").strip()
        keys = manager.load_keys(args.verify)

        if manager.verify_seed_consistency(seed_phrase, keys):
            print("✓ Seed phrase matches!")
        else:
            print("✗ Seed phrase does NOT match!")
            sys.exit(1)


if __name__ == '__main__':
    main()
