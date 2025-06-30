const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // ajuste sua senha aqui
  database: 'zapfreela',
});

const saltRounds = 10;

// Rota teste
app.get('/teste', (req, res) => {
  res.send('Servidor rodando OK');
});

// Cadastro unificado
app.post('/cadastro', (req, res) => {
  const { nome, email, telefone, senha, tipo, categoria_nome, descricao } = req.body;

  if (!nome || !email || !senha || !tipo || !['freelancer', 'contratante'].includes(tipo)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  bcrypt.hash(senha, saltRounds, (errHash, hash) => {
    if (errHash) {
      console.error(errHash);
      return res.status(500).json({ error: 'Erro ao processar senha' });
    }

    const sqlInserirUsuario = `INSERT INTO usuarios (nome, email, telefone, senha, tipo) VALUES (?, ?, ?, ?, ?)`;
    db.query(sqlInserirUsuario, [nome, email, telefone, hash, tipo], (errUser, resultUser) => {
      if (errUser) {
        console.error(errUser);
        if (errUser.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }
        return res.status(500).json({ error: 'Erro no cadastro do usuário' });
      }

      const usuarioId = resultUser.insertId;

      if (tipo === 'freelancer') {
        if (!categoria_nome) {
          return res.status(400).json({ error: 'Categoria obrigatória para freelancer' });
        }

        // Pega categoria pelo nome (lowercase para evitar erro)
        const sqlCategoria = `SELECT id FROM categorias WHERE LOWER(nome) = LOWER(?) LIMIT 1`;
        db.query(sqlCategoria, [categoria_nome], (errCat, categorias) => {
          if (errCat) {
            console.error(errCat);
            return res.status(500).json({ error: 'Erro ao buscar categoria' });
          }
          if (categorias.length === 0) {
            return res.status(400).json({ error: 'Categoria não existe' });
          }
          const categoriaId = categorias[0].id;

          const sqlInserirFreelancer = `INSERT INTO freelancers (id, categoria_id, descricao) VALUES (?, ?, ?)`;
          db.query(sqlInserirFreelancer, [usuarioId, categoriaId, descricao || null], (errFree) => {
            if (errFree) {
              console.error(errFree);
              return res.status(500).json({ error: 'Erro ao cadastrar freelancer' });
            }
            return res.status(201).json({ message: 'Freelancer cadastrado com sucesso', id: usuarioId });
          });
        });
      } else {
        return res.status(201).json({ message: 'Contratante cadastrado com sucesso', id: usuarioId });
      }
    });
  });
});

// Listar freelancers com filtro, paginação, busca e avaliação média
app.get('/freelancers', (req, res) => {
  const categoria = req.query.categoria || 'all';
  const busca = req.query.busca || '';
  const pagina = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (pagina - 1) * limit;

  // Condição para filtro por categoria
  let whereCategoria = '';
  let params = [];

  if (categoria !== 'all') {
    whereCategoria = 'AND LOWER(c.nome) = LOWER(?)';
    params.push(categoria);
  }

  // Condição para busca no nome do usuário freelancer
  let whereBusca = '';
  if (busca.trim()) {
    whereBusca = 'AND u.nome LIKE ?';
    params.push(`%${busca}%`);
  }

  // Query que retorna freelancers com avaliação média e total de avaliações
  // JOIN usuarios, freelancers, categorias e avaliações (LEFT para avaliar mesmo sem avaliações)
  const sqlFreelancers = `
    SELECT 
      u.id,
      u.nome,
      u.telefone,
      c.nome AS categoria,
      f.descricao,
      COALESCE(AVG(a.nota), 0) AS avaliacao,
      COUNT(a.id) AS num_avaliacoes
    FROM usuarios u
    INNER JOIN freelancers f ON f.id = u.id
    INNER JOIN categorias c ON c.id = f.categoria_id
    LEFT JOIN avaliacoes a ON a.freelancer_id = f.id
    WHERE 1=1
    ${whereCategoria}
    ${whereBusca}
    GROUP BY u.id
    ORDER BY avaliacao DESC, u.nome ASC
    LIMIT ? OFFSET ?`;

  // Para contagem total de resultados
  const sqlCount = `
    SELECT COUNT(*) AS total
    FROM usuarios u
    INNER JOIN freelancers f ON f.id = u.id
    INNER JOIN categorias c ON c.id = f.categoria_id
    WHERE 1=1
    ${whereCategoria}
    ${whereBusca}`;

  db.query(sqlCount, params, (errCount, countResult) => {
    if (errCount) {
      console.error(errCount);
      return res.status(500).json({ error: 'Erro ao contar freelancers' });
    }
    const total = countResult[0].total;

    params.push(limit, offset);

    db.query(sqlFreelancers, params, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar freelancers' });
      }
      return res.json({
        data: results,
        total,
        page: pagina,
        limit,
      });
    });
  });
});

// Criar avaliação
app.post('/avaliacoes', (req, res) => {
  const { freelancer_id, contratante_id, nota, comentario } = req.body;

  if (!freelancer_id || !nota || nota < 1 || nota > 5) {
    return res.status(400).json({ error: 'Dados da avaliação inválidos' });
  }

  const sql = `INSERT INTO avaliacoes (freelancer_id, contratante_id, nota, comentario) VALUES (?, ?, ?, ?)`;
  db.query(sql, [freelancer_id, contratante_id || null, nota, comentario || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar avaliação' });
    }
    res.status(201).json({ message: 'Avaliação cadastrada com sucesso', id: result.insertId });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
