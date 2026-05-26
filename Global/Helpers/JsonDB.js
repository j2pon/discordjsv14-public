const fs = require('fs');
const path = require('path');

class JsonDatabase {
    constructor(options = {}) {
        this.filePath = options.Path || options.filePath || path.join(__dirname, '../../database.json');
        this.data = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(fileContent);
            } else {
                this.data = {};
                this.save();
            }
        } catch (error) {
            console.error('JSON database yükleme hatası:', error);
            this.data = {};
        }
    }

    save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (error) {
            console.error('JSON database kaydetme hatası:', error);
        }
    }

    set(key, value) {
        const keys = key.split('.');
        let current = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.save();
        return value;
    }

    get(key) {
        const keys = key.split('.');
        let current = this.data;
        for (const k of keys) {
            if (current == null || typeof current !== 'object') {
                return undefined;
            }
            current = current[k];
        }
        return current;
    }

    delete(key) {
        const keys = key.split('.');
        let current = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                return false;
            }
            current = current[keys[i]];
        }
        delete current[keys[keys.length - 1]];
        this.save();
        return true;
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    all() {
        return Object.entries(this.data).map(([key, value]) => ({ key, value }));
    }

    clear() {
        this.data = {};
        this.save();
        return true;
    }

    some(callback) {
        return Object.values(this.data).some(callback);
    }
}

module.exports = { JsonDatabase };

