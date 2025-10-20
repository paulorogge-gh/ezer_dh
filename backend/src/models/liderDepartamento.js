const { getPool } = require('../config/db');

class LiderDepartamento {
    constructor(data) {
        this.id_lider = data.id_lider;
        this.id_departamento = data.id_departamento;
    }

    static async create(data) {
        try {
            const pool = getPool();
            await pool.execute('INSERT INTO lider_departamento (id_lider, id_departamento) VALUES (?, ?)', [data.id_lider, data.id_departamento]);
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Departamento já vinculado a este líder');
            }
            throw new Error(`Erro ao criar vínculo líder-departamento: ${error.message}`);
        }
    }

    static async delete(data) {
        try {
            const pool = getPool();
            await pool.execute('DELETE FROM lider_departamento WHERE id_lider = ? AND id_departamento = ?', [data.id_lider, data.id_departamento]);
            return true;
        } catch (error) {
            throw new Error(`Erro ao remover vínculo líder-departamento: ${error.message}`);
        }
    }
}

module.exports = LiderDepartamento;


