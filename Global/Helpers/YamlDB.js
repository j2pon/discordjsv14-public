const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class YamlDatabase {
    constructor(options = {}) {
        this.filePath = options.filePath || path.join(__dirname, '../../database.yaml');
        this.data = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf8');
                this.data = yaml.load(fileContent) || {};
            } else {
                this.data = {};
                this.save();
            }
        } catch (error) {
            console.error('YAML database yükleme hatası:', error);
            this.data = {};
        }
    }

    save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.filePath, yaml.dump(this.data, { indent: 2 }), 'utf8');
        } catch (error) {
            console.error('YAML database kaydetme hatası:', error);
        }
    }

    async set(key, value) {
        this.data[key] = value;
        this.save();
        return value;
    }

    async get(key) {
        return this.data[key];
    }

    async delete(key) {
        delete this.data[key];
        this.save();
        return true;
    }

    async has(key) {
        return key in this.data;
    }

    async all() {
        return Object.entries(this.data).map(([key, value]) => ({ key, value }));
    }

    async clear() {
        this.data = {};
        this.save();
        return true;
    }

    some(callback) {
        return Object.values(this.data).some(callback);
    }
}

module.exports = { YamlDatabase };

