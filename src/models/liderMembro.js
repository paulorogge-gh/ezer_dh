const { getPool } = require('../config/db');

class LiderMembro {
    constructor(data) {
        this.id_lider = data.id_lider;
        this.id_liderado = data.id_liderado;
    }

    static async create(data) {
        try {
            const pool = getPool();
            await pool.execute('INSERT INTO lider_membro (id_lider, id_liderado) VALUES (?, ?)', [data.id_lider, data.id_liderado]);
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Colaborador já está vinculado a este líder');
            }
            throw new Error(`Erro ao criar vínculo líder-liderado: ${error.message}`);
        }
    }

    static async delete(data) {
        try {
            const pool = getPool();
            await pool.execute('DELETE FROM lider_membro WHERE id_lider = ? AND id_liderado = ?', [data.id_lider, data.id_liderado]);
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover vínculo líder-liderado: ${error.message}`);
        }
    }
}

module.exports = LiderMembro;


