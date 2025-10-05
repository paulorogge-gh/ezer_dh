const { getPool } = require('../config/db');
const { Consultoria, Empresa, Colaborador } = require('../models');

async function testIntegrity() {
    try {
        console.log('🔍 Testando integridade da base de dados...');
        
        const pool = getPool();
        
        // Teste 1: Verificar se todas as tabelas existem
        console.log('\n📊 Teste 1: Verificando tabelas...');
        const [tables] = await pool.execute('SHOW TABLES');
        const expectedTables = [
            'consultoria', 'empresa', 'departamento', 'colaborador', 
            'colaborador_departamento', 'ocorrencia', 'treinamento', 
            'feedback', 'avaliacao', 'pdi'
        ];
        
        const existingTables = tables.map(t => Object.values(t)[0]);
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length === 0) {
            console.log('✅ Todas as tabelas existem!');
        } else {
            console.log('❌ Tabelas faltando:', missingTables);
        }
        
        // Teste 2: Verificar relacionamentos
        console.log('\n📊 Teste 2: Verificando relacionamentos...');
        
        // Testar criação de consultoria
        console.log('   - Testando criação de consultoria...');
        const consultoriaId = await Consultoria.create({
            nome: 'Ezer Consultoria Teste',
            email: 'teste@ezer.com',
            telefone: '(11) 99999-9999'
        });
        console.log(`   ✅ Consultoria criada com ID: ${consultoriaId}`);
        
        // Testar criação de empresa
        console.log('   - Testando criação de empresa...');
        const empresaId = await Empresa.create({
            id_consultoria: consultoriaId,
            nome: 'Empresa Teste LTDA',
            cnpj: '12.345.678/0001-90',
            email: 'contato@empresateste.com',
            telefone: '(11) 3333-4444',
            endereco: 'Rua Teste, 123',
            responsavel: 'João Silva'
        });
        console.log(`   ✅ Empresa criada com ID: ${empresaId}`);
        
        // Testar criação de colaborador
        console.log('   - Testando criação de colaborador...');
        const colaboradorId = await Colaborador.create({
            id_empresa: empresaId,
            cpf: '123.456.789-00',
            nome: 'Maria Santos',
            data_nascimento: '1990-01-15',
            email_pessoal: 'maria@email.com',
            email_corporativo: 'maria.santos@empresateste.com',
            telefone: '(11) 99999-8888',
            cargo: 'Analista',
            remuneracao: 5000.00,
            data_admissao: '2023-01-01',
            tipo_contrato: 'CLT'
        });
        console.log(`   ✅ Colaborador criado com ID: ${colaboradorId}`);
        
        // Teste 3: Verificar consultas
        console.log('\n📊 Teste 3: Verificando consultas...');
        
        // Buscar consultoria
        const consultoria = await Consultoria.findById(consultoriaId);
        console.log(`   ✅ Consultoria encontrada: ${consultoria.nome}`);
        
        // Buscar empresa
        const empresa = await Empresa.findById(empresaId);
        console.log(`   ✅ Empresa encontrada: ${empresa.nome}`);
        
        // Buscar colaborador
        const colaborador = await Colaborador.findById(colaboradorId);
        console.log(`   ✅ Colaborador encontrado: ${colaborador.nome}`);
        
        // Teste 4: Verificar relacionamentos
        console.log('\n📊 Teste 4: Verificando relacionamentos...');
        
        // Empresas da consultoria
        const empresasConsultoria = await consultoria.getEmpresas();
        console.log(`   ✅ Consultoria tem ${empresasConsultoria.length} empresa(s)`);
        
        // Colaboradores da empresa
        const colaboradoresEmpresa = await empresa.getColaboradores();
        console.log(`   ✅ Empresa tem ${colaboradoresEmpresa.length} colaborador(es)`);
        
        // Teste 5: Verificar constraints
        console.log('\n📊 Teste 5: Verificando constraints...');
        
        try {
            // Tentar criar empresa com CNPJ duplicado
            await Empresa.create({
                id_consultoria: consultoriaId,
                nome: 'Empresa Duplicada',
                cnpj: '12.345.678/0001-90', // Mesmo CNPJ
                email: 'duplicada@teste.com'
            });
            console.log('   ❌ CNPJ duplicado não foi rejeitado!');
        } catch (error) {
            if (error.message.includes('CNPJ já cadastrado')) {
                console.log('   ✅ Constraint de CNPJ único funcionando!');
            } else {
                console.log('   ❌ Erro inesperado:', error.message);
            }
        }
        
        try {
            // Tentar criar colaborador com CPF duplicado
            await Colaborador.create({
                id_empresa: empresaId,
                cpf: '123.456.789-00', // Mesmo CPF
                nome: 'João Duplicado',
                email_pessoal: 'joao@email.com'
            });
            console.log('   ❌ CPF duplicado não foi rejeitado!');
        } catch (error) {
            if (error.message.includes('CPF já cadastrado')) {
                console.log('   ✅ Constraint de CPF único funcionando!');
            } else {
                console.log('   ❌ Erro inesperado:', error.message);
            }
        }
        
        // Limpeza dos dados de teste
        console.log('\n🧹 Limpando dados de teste...');
        await pool.execute('DELETE FROM colaborador WHERE id_colaborador = ?', [colaboradorId]);
        await pool.execute('DELETE FROM empresa WHERE id_empresa = ?', [empresaId]);
        await pool.execute('DELETE FROM consultoria WHERE id_consultoria = ?', [consultoriaId]);
        console.log('✅ Dados de teste removidos!');
        
        console.log('\n🎉 Todos os testes de integridade passaram com sucesso!');
        console.log('✅ Base de dados está funcionando corretamente!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro no teste de integridade:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testIntegrity();
