class productsDAO {
    static async getProducts(db){
        const sql = `SELECT p.idproduto, c.descricao AS categoriaDescricao, t.name, p.nome AS produtoNome,
            SUBSTRING(p.nome, 1, 36) AS produtoNomeMin, p.descricao, SUBSTRING(p.descricao, 1, 100) AS descricaoMin,
            p.imagem, p.quant, p.status, p.score, p.por, p.publicado, p.idade_de_leitura, p.numero_de_paginas, p.idioma,
            p.dimensoes, p.editora, p.edicao, p.tamanho_do_arquivo, f.nome, pf.preco, pf.desconto, co.current AS coin, co.nome AS coNome
            FROM produto p
            INNER JOIN produto_formato pf ON (p.idproduto = pf.idproduto)
            INNER JOIN formato f ON (pf.idformato = f.idformato)
            INNER JOIN categoria c ON (c.id_categoria = p.categoria_id_categoria)
            INNER JOIN produtotipo t ON (p.idproduto_tipo = t.idproduto_tipo)
            INNER JOIN country co ON (p.countryid = co.idcountry)
            WHERE co.nome = ? AND p.status = ?
            GROUP BY p.idproduto
            ORDER BY c.id_categoria, p.idproduto`;
    
        const values = ["en-gb", "A"];
        try {
            const conn=await db();
            const [rows] = await conn.query(sql, values);
            if(rows[0]!==undefined){
                return rows;
            }else
                return null;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    static async getcat(db){
        const sql = `SELECT CONCAT("/books/", LOWER(c.descricao)) AS path,
        c.descricao AS name
        FROM categoria c INNER JOIN produto p ON (p.categoria_id_categoria=c.id_categoria)
        INNER JOIN country co ON (co.idcountry=p.countryid)
        WHERE co.nome = ? AND p.status = ?
        GROUP BY c.descricao`;
    
        const values = ["en-gb", "A"];
        try {
            const conn=await db();
            const [rows] = await conn.query(sql, values);
            if(rows[0]!==undefined){
                return rows;
            }else
                return null;
        } catch (error) {
            throw new Error(error.message);
        }
    }
    static async searchProducts(db, search) {
        var sql = `SELECT p.idproduto, p.nome, p.descricao, p.imagem, p.score,
        (SELECT MIN(preco) FROM produto_formato WHERE p.idproduto=idproduto) "preco", co.current FROM produto p
        INNER JOIN country co ON (co.idcountry=p.countryid) INNER JOIN produto_formato pf ON (p.idproduto=pf.idproduto)
        INNER JOIN itens i ON (i.produto_idproduto=p.idproduto)
        WHERE co.nome = ? AND p.status = ?
        GROUP BY p.idproduto
        ORDER BY i.qtde
        DESC`;

        var values = ["en-gb", "A"];
        if(search['s']!==''){
            sql = `SELECT p.idproduto, p.nome, p.descricao, p.imagem, p.score,
            (SELECT MIN(preco) FROM produto_formato WHERE p.idproduto=idproduto) "preco", co.current FROM produto p
                INNER JOIN country co ON (co.idcountry = p.countryid) INNER JOIN produto_formato pf ON (p.idproduto=pf.idproduto)
                WHERE (p.nome LIKE ? OR p.descricao LIKE ? OR p.por LIKE ? OR p.editora LIKE ?) 
                AND co.nome = ? AND p.status = ? GROUP BY p.idproduto`;

            values = [`%${search['s']}%`, `%${search['s']}%`, `%${search['s']}%`, `%${search['s']}%`, "en-gb", "A"];
        }
        try {
            const conn = await db();
            const [rows] = await conn.query(sql, values);
            if (rows[0] !== undefined) {
                return rows;
            } else {
                return [];
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
}

module.exports = productsDAO;