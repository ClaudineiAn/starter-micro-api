class productsDAO {
    static async home(db){
        const sql = `(SELECT co.current, CONCAT("{",GROUP_CONCAT(CONCAT('[{"name":"',f.nome,'","price":',pf.preco,',"discount":',pf.desconto,"}]") SEPARATOR "','"),"}") "formats", pt.name "productType", p.nome, "0" AS "descounts",SUM(i.qtde) "TotalVendas", p.descricao, p.imagem, p.score, p.por, p.publicado, p.idade_de_leitura, p.numero_de_paginas, p.idioma, p.dimensoes, p.editora, p.edicao, p.tamanho_do_arquivo, p.countryid
        FROM venda v 
        INNER JOIN itens i ON (i.venda_idvenda=v.idvenda)
        INNER JOIN produto p ON (p.idproduto=i.produto_idproduto)
        INNER JOIN country co ON (p.countryid = co.idcountry)
        INNER JOIN produtotipo pt ON (pt.idproduto_tipo = p.idproduto_tipo)
        INNER JOIN produto_formato pf ON (pf.idproduto = p.idproduto)
        INNER JOIN formato f ON (f.idformato = pf.idformato)
        WHERE co.nome = ? AND p.status = ?
        GROUP BY p.idproduto
        LIMIT 50)
        UNION
        (SELECT co.current, CONCAT("{",GROUP_CONCAT(CONCAT('[{"name":"',f.nome,'","price":',pf.preco,',"discount":',pf.desconto,"}]") SEPARATOR "','"),"}") "formats", pt.name "productType", p.nome, d.descounts, "0" AS "TotalVendas", p.descricao, p.imagem, p.score, p.por, p.publicado, p.idade_de_leitura, p.numero_de_paginas, p.idioma, p.dimensoes, p.editora, p.edicao, p.tamanho_do_arquivo, p.countryid
        FROM produto p
        JOIN (
            SELECT idproduto,MAX(desconto) "descounts"
            FROM produto_formato
            GROUP BY idproduto
        ) d ON (p.idproduto = d.idproduto)
        INNER JOIN country co ON (p.countryid = co.idcountry)
        INNER JOIN produtotipo pt ON (pt.idproduto_tipo = p.idproduto_tipo)
        INNER JOIN produto_formato pf ON (pf.idproduto = p.idproduto)
        INNER JOIN formato f ON (f.idformato = pf.idformato)
        WHERE co.nome = ? AND p.status = ?
        WHERE d.descounts>0
        GROUP BY d.idproduto
        LIMIT 50)
        ORDER BY RAND()`;
    
        const values = ["en-gb", "A","en-gb", "A"];
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
        var sql = `SELECT p.idproduto, p.nome, p.descricao, p.imagem, p.score, SUM(i.qtde) total_quantity,
        (SELECT MIN(preco) FROM produto_formato WHERE p.idproduto=idproduto) "preco", co.current FROM produto p
        INNER JOIN country co ON (co.idcountry=p.countryid) INNER JOIN produto_formato pf ON (p.idproduto=pf.idproduto)
        INNER JOIN itens i ON (i.produto_idproduto=p.idproduto)
        GROUP BY p.idproduto
        ORDER BY total_quantity
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