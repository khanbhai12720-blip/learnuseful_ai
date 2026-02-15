const crypto = require('crypto');

// ========================================
// DATA ENCRYPTION UTILITY
// ========================================

class EncryptionService {
    constructor() {
        this.algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
        this.key = crypto.scryptSync(
            process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production',
            process.env.ENCRYPTION_SALT || 'salt',
            32
        );
    }

    /**
     * Encrypt sensitive data
     */
    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedData) {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(encryptedData.iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    /**
     * Hash sensitive data (one-way)
     */
    hash(data) {
        return crypto
            .createHash('sha256')
            .update(data + process.env.HASH_SALT)
            .digest('hex');
    }

    /**
     * Mask credit card number
     */
    maskCreditCard(cardNumber) {
        return cardNumber.replace(/\d(?=\d{4})/g, '*');
    }

    /**
     * Mask email
     */
    maskEmail(email) {
        const [name, domain] = email.split('@');
        const masked = name.substring(0, 2) + '*'.repeat(name.length - 2);
        return `${masked}@${domain}`;
    }

    /**
     * Mask phone number
     */
    maskPhoneNumber(phone) {
        return phone.replace(/\d(?=\d{4})/g, '*');
    }
}

module.exports = new EncryptionService();