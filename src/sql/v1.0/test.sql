-- 测试
SELECT * FROM ( SELECT * FROM test a ) b UNION SELECT * FROM ( SELECT * FROM test c ) d UNION SELECT * FROM test UNION SELECT * FROM ( SELECT * FROM ( SELECT * FROM test ) ) union select * from ( select * from ( select * from ( select * from ( select * from ( select * from test where id > 10 ) ) ) ) )


-- 正确SQL
select * from ( select * from test ) A join B on A.id = B.id group by A.name having sum(age) > 0 where A.id = 100 and B.id between 10 and 20 and A.name is null and B.id like '%s' ;
select * from ( select * from test A ) B union select * from ( select * from test C ) D
select * from ( select * from ( select * from test ) )
select * from ( select * from test A ) B union select * from ( select * from test C ) D union select * from test2 E
SELECT * FROM test a INNER JOIN test2 b ON a.id = b.id AND a.name = b.name WHERE a.id BETWEEN 10 AND 20 UNION SELECT * FROM test3 union select name, id from ( select * from ( select count(id) from test4 ) )
SELECT * FROM ( SELECT * FROM test a ) b UNION SELECT * FROM ( SELECT * FROM test c ) d UNION SELECT * FROM test UNION SELECT * FROM ( SELECT * FROM ( SELECT * FROM test ) );
SELECT * FROM ( SELECT * FROM test a ) b UNION SELECT * FROM ( SELECT * FROM test c ) d UNION SELECT * FROM test UNION SELECT * FROM ( SELECT * FROM ( SELECT * FROM test ) ) union select * from ( select * from ( select * from ( select * from ( select * from ( select * from test where id > 10 ) ) ) ) )
select * from ( select * from ( select * from ( select * from ( select * from ( select * from test ) ) ) ) )




select id, name FROM test WHERE id > 10 and name < "key";

update `test` set name = "key", age = 30 where id = 20
UPDATE `test` A SET name = "key", `age` = 30 join test 2 B on A.id = B.id WHERE id = 20;

delete from test a join b on a.id = b.id and a.name = b.name where id > 10;

-- 错误SQL
select id, name, from test
select * from ( select * from test A ) B union select * from ( select * from test C ) D union select * from test2 E d

delete test from test a join b on a.id = b.id and a.name = b.name where id > 10;



-- 其他
select * from (
select * from (
 select * from A left join t union select * from Q
) ) B
) C

update db.table set name = "eason" where id = 10;

select * from A  JOIN B where id>100 UNION select * from c



SELECT * FROM test left join C WHERE id = 10 ORDER BY id DESC;

SELECT db.name.sd AS test , coun(db.name.sd) tt
    FROM a
    WHERE db.name.sd>100 OR db.name.sd > 10
    ORDER BY ide DESC , dsf.dsad.dsfsd ASC
    LIMIT 6;


UPDATE test
    SET name = 432, age = 43
    WHERE id = 10;


DELETE FROM table_name
WHERE some_column=some_value;


SELECT * FROM articles WHERE category_id = 123 ORDER BY id LIMIT 50, 10 UNION SELECT * FROM ( select * from A )

SELECT * FROM articles WHERE category_id = 123 ORDER BY id LIMIT 50, 10 UNION SELECT * FROM ( select * from A )



SELECT * fds;

update test;


SELECT * FROM articles WHERE  id >=
 (SELECT id FROM articles  WHERE category_id = 123 ORDER BY id LIMIT 10000, 1) LIMIT 10


 SELECT * FROM `content` AS t1
JOIN (SELECT id FROM `content` ORDER BY id desc LIMIT ".($page-1)*$pagesize.", 1) AS t2
WHERE t1.id <= t2.id ORDER BY t1.id desc LIMIT $pagesize;


SELECT * FROM articles WHERE id >= ( SELECT id FROM articles WHERE category_id = 123 ORDER BY id LIMIT 10000, 1) LIMIT 10 UNION all select * from test

SELECT * FROM articles WHERE id >= ( SELECT id FROM articles WHERE category_id = 123 ORDER BY id LIMIT 10000, 1) LIMIT 10 UNION all select * from test



SELECT * FROM articles WHERE id>=(SELECT id FROM articles WHERE category_id = 123 ORDER BY id LIMIT 10000, 1) LIMIT 10 UNION ALL SELECT * FROM test ;


select * from ( select * from test )

select * from (A) ( select * from test )

SELECT * FROM (a) a A ( SELECT * FROM test );

SELECT * FROM a, b, c, d, WHERE a.id > 10;



SELECT *
    FROM a
    INNER JOIN b ON a.id = b.id;

SELECT * FROM articles WHERE id>=(SELECT ( id FROM articles WHERE category_id = 123 ORDER BY id LIMIT 10000, 1) LIMIT 10 UNION ALL SELECT * FROM test ;

SELECT * , COUNT(*), discount(*) FROM a INNER JOIN b ON a.id = b.id AND c.id = d.id where id = ( select count(*) from test )

SELECT * , COUNT(*), discount(*) FROM a INNER JOIN b ON a.id = b.id AND c.id = d.id WHERE id = ( SELECT COUNT(*) FROM test WHERE id BETWEEN 10 AND 20 );


SELECT *
    FROM test
    GROUP BY id
    HAVING COUNT(*) > 10;

SELECT * FROM ( SELECT * FROM ( SELECT * FROM ( SELECT * FROM ( SELECT * FROM ( SELECT * FROM test ) ) ) ) );

select * from A join B on A.id = B.id and A.id = B.ci group by A.name having sum(age) > 10 where A.age between 10 and 20







-- 测试SQL

---------------替换为第2种---------------
SELECT ProductID, Total = SUM(LineTotal) FROM Sales.SalesOrderDetail GROUP BY ProductID HAVING SUM(LineTotal) > $2000000.00 ;

SELECT ProductID , SUM( LineTotal ) AS Total FROM Sales.SalesOrderDetail GROUP BY ProductID HAVING SUM( LineTotal ) > $2000000.00 ;
---------------替换为第2种---------------

SELECT ProductID, AVG(OrderQty) AS AverageQuantity, SUM(LineTotal) AS Total FROM Sales.SalesOrderDetail GROUP BY ProductID HAVING SUM(LineTotal) > $1000000.00 AND AVG(OrderQty) < 3 ;


SELECT ProductID, SUM(LineTotal) AS Total FROM Sales.SalesOrderDetail GROUP BY ProductID HAVING COUNT(*) > 1500 ;


SELECT ProductID FROM Sales.SalesOrderDetail GROUP BY ProductID HAVING AVG(OrderQty) > 5 ORDER BY ProductID ;

select * from( SELECT pm.Name, AVG(ListPrice) AS 'Average List Price' FROM Production.Product AS p JOIN Production.ProductModel AS pm ON p.ProductModelID = pm.ProductModelID GROUP BY pm.Name HAVING pm.Name LIKE 'Mountain%' ORDER BY pm.Name );

SELECT pm.Name, AVG(ListPrice) AS 'Average List Price' FROM Production.Product AS p JOIN Production.ProductModel AS pm ON p.ProductModelID = pm.ProductModelID GROUP BY pm.Name HAVING pm.Name LIKE 'Mountain%' ORDER BY pm.Name ;

select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;

select *, count(*) from ( select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 )

select (productid).dsds.dsdsds.dsdsds.dsds , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;

SELECT * FROM ( SELECT * , COUNT( * ) FROM ( SELECT productid , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total FROM sales.salesorderdetail GROUP BY productid HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 ) ) ) ) ) ) ;

SELECT * FROM ( SELECT * , COUNT( * ) FROM ( SELECT productid , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total FROM sales.salesorderdetail GROUP BY productid HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 ) ) ) ) ) ) ;

SELECT site_id , count, SUM( access_log.COUNT ) AS "nums hehe" FROM access_log GROUP BY site_id ;

SELECT site_id , SUM( access_log.count ) AS "nums hehe" FROM access_log GROUP BY site_id ;

SELECT site_id, SUM(access_log.count) AS nums FROM access_log GROUP BY site_id;

SELECT Websites.name,COUNT(access_log.aid) AS nums FROM access_log LEFT JOIN Websites ON access_log.site_id=Websites.id GROUP BY Websites.name;

SELECT site_id , `cou nt` , SUM( access_log.count ) AS "nums hehe" FROM access_log GROUP BY site_id ;

SELECT site_id , `cou nt` , SUM( access_log.count ) AS "nums hehe" FROM access_log LEFT JOIN db.test GROUP BY site_id ;

SELECT Websites.name , COUNT( access_log.aid ) AS 'nums . sd' FROM access_log LEFT JOIN Websites ON access_log.site_id = Websites.id GROUP BY Websites.name ;

insert into test.test ( " age" , " _test" ) values ( 32, " hx _ ds " );

insert into test.test values ( 32, "hx _ ds " );

UPDATE test SET name = "dsds", age = 87 where id > 9 ;

UPDATE test SET name = "dsds", age > 87 where id > 9 ;

select distinct(productid ) , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;

select * from ( select * from ( select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ) ) ;

SELECT * FROM ( SELECT * FROM ( SELECT productid , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total FROM sales.salesorderdetail GROUP BY productid HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 )group by test.name having avg(score) > 87 ) where id > 98 ;

select * , id , name from ( select * , id , name from (  select * , name from d1.test t1 , t3  left join d2.test2 on t1.uid = t2.id group by test2.name having ( id ) > 10 where id > 0 and concat(name) = "kidel" limit 0 , 32  ) as b ) as a where id > 10 and name != "" order by id desc limit 10 , 200;

SELECT productid / 10 , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total FROM sales.salesorderdetail GROUP BY productid HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 ;
SELECT productid/10 , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total FROM sales.salesorderdetail GROUP BY productid HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 ;


select * , id , name from ( select * , id , name from ( select * , name from d1.test t1 , t3 left join d2.test2 on t1.uid = t2.id group by test2.name having ( id ) > 10 where id > 0 and concat(name) = "kidel" limit 0 , 32 ) as b ) as a where id > 10 and name != "" order by id desc limit 10 , 200;

INSERT INTO test ( name, age ) VALUES ( "Jack", 65 )

update a set a.col=b.col from a join b on a.id=b.id

DELETE A FROM YSHA A LEFT JOIN YSHB B ON A.code=b.code WHERE b.code = "jk"

select name , age from db.users left join db.test on users.id = test.uid where id > 0 and id < 1000 order by id desc limit 5 , 100 ;

SELECT E_Name FROM Employees_China UNION SELECT E_Name FROM Employees_USA

delete a from ysha a left join yshb b on a.code = b.code group by a.name having ( a.id ) > 0 where b.code = "jk"


SELECT d1.t1.c1 , d1.t1.c2, d1.t1.c3, c4, t1.c5 , , , c6,  from d1.t1, d2.t2, d3.t3, t4 , , , , ;

select * from a order by code, name desc;

SELECT d1.t1.c1 , d1.t1.c2, d1.t1.c3, c4, t1.c5 , , , c6,  from d1.t1 ;

select * from a order by code desc, name desc;

select * from ( select * from ( select * from a group by t.a.name order by d1.t1.code desc, d1.t1.name desc ) )

select * from ( select * from ( select * from a group by t.a.name where id > 1 and id != 87 and concat( name ) = concat("eason") order by d1.t1.code desc, d1.t1.name desc ) )

SELECT * FROM ( SELECT * FROM ( SELECT * FROM d1.test t1, t3  LEFT JOIN d2.test2 ON t1.uid = t2.id WHERE id > 0 and concat(name) = "Kidel" limit 0, 32 ) )

SELECT * FROM ( SELECT id, name FROM ( SELECT age FROM test as t1, test2 as t2 left join test3 as t3 on t2.u_id = t3.id WHERE id>0 AND id<87 AND name='test' and t1.id=t2.id group by t1.name ORDER BY id DESC LIMIT 5 ) )

SELECT d1.t1.c1 , d1.t1.c2, d1.t1.c3 from d1.t1 ;

SELECT * FROM ( SELECT * FROM ( SELECT * FROM d1.test t1, t3 LEFT JOIN d2.test2 ON t1.uid = t2.id WHERE id > 0 and concat(name) = "Kidel" limit 0, 32 ) )

select *, id, name from ( select *, id, name from ( select *,name from d1.test t1 , t3 left join d2.test2 on t1.uid = t2.id where id > 0 and name = "kidel" limit 0 , 32 ) AS B ) as A ;


select e_name from employees_china union select e_name from employees_usa
select e_name from employees_china union all select e_name from employees_usa

SELECT * FROM ( SELECT e_name FROM employees_china UNION ALL SELECT e_name FROM employees_usa all WHERE name is null ) ;



select * from ( select e_name from employees_china union all select e_name from employees_usa )

select e_name from employees_china union select e_name from employees_usa union select e_name from employees_usa

SELECT from_unixtime(e_name) FROM employees_china UNION ALL SELECT e_name FROM employees_usa UNION SELECT e_name FROM employees_usa ; all

SELECT * FROM ( SELECT * FROM test union select * from test


select column1 as alias_column1, max( column1 , param2 ), table1.column1, sum( db1.table1.column1 , param2 ) from ( select *, max( db2.table2.column2 , param2 ), *, round( column1 , param2 ) from db.table1, table1, db.table1, table1 where db2.table2.column2 >= d_fake AND db2.table2.column2 = 2927 AND column1 <> p_fake AND column1 as alias_column1 is null r_fake order by db1.table1.column1 alias_column1, * desc, table2.column2 alias_column2 asc, table1.column1 alias_column1 limit 9734 ) where db1.table1.column1 != z_fake AND db2.table2.column2 like h_fake AND table1.column1 alias_column1 like n_fake AND db1.table1.column1 is null e_fake order by column1 alias_column1, column1 as alias_column1 desc, table2.column2 alias_column2 asc, table2.column2 alias_column2 limit 5567 , 58 union select table1.column1 as alias_column1, now( table1.column1 alias_column1 , param2 ), table2.column2, max( table1.column1 alias_column1 , param2 ) from db.table1, table1, db.table1, table1 where column1 as alias_column1 like l_fake AND table2.column2 is not null 6754 AND table2.column2 != c_fake AND column1 < h_fake order by column1, table1.column1 as alias_column1 desc, * asc, * limit 3782


select column1 as alias_column1, max( column1 , param2 ), table1.column1, sum( db1.table1.column1 , param2 ) from ( select *, max( db2.table2.column2 , param2 ), *, round( column1 , param2 ) from db.table1, table1, db.table1, table1 where db2.table2.column2 >= d_fake AND db2.table2.column2 = 2927 AND column1 <> p_fake AND column1 as alias_column1 is null r_fake order by db1.table1.column1 alias_column1, * desc, table2.column2 alias_column2 asc, table1.column1 alias_column1 limit 9734 ) where db1.table1.column1 != z_fake AND db2.table2.column2 like h_fake AND table1.column1 alias_column1 like n_fake AND db1.table1.column1 is null e_fake order by column1 alias_column1, column1 as alias_column1 desc, table2.column2 alias_column2 asc, table2.column2 alias_column2 limit 5567 , 58 union select table1.column1 as alias_column1, now( table1.column1 alias_column1 , param2 ), table2.column2, max( table1.column1 alias_column1 , param2 ) from db.table1, table1, db.table1, table1 where column1 as alias_column1 like l_fake AND table2.column2 is not null 6754 AND table2.column2 != c_fake AND column1 < h_fake order by column1, table1.column1 as alias_column1 desc, * asc, * limit 3782

select column1 as alias_column1, max( column1 , param2 ), table1.column1, sum( db1.table1.column1 , param2 ) from ( select *, max( db2.table2.column2 , param2 ), *, round( column1 , param2 ) from db.table1, table1, db.table1, table1 where db2.table2.column2 >= d_fake AND db2.table2.column2 = 2927 AND column1 <> p_fake AND column1 as alias_column1 is null r_fake order by db1.table1.column1 alias_column1, * desc, table2.column2 alias_column2 asc, table1.column1 alias_column1 limit 9734 ) where db1.table1.column1 != z_fake AND db2.table2.column2 like h_fake AND table1.column1 alias_column1 like n_fake AND db1.table1.column1 is null e_fake order by column1 alias_column1, column1 as alias_column1 desc, table2.column2 alias_column2 asc, table2.column2 alias_column2 limit 5567 , 58 union select table1.column1 as alias_column1, now( table1.column1 alias_column1 , param2 ), table2.column2, max( table1.column1 alias_column1 , param2 ) from db.table1, table1, db.table1, table1 where column1 as alias_column1 like l_fake AND table2.column2 is not null 6754 AND table2.column2 != c_fake AND column1 < h_fake order by column1, table1.column1 as alias_column1 desc, * asc, * limit 3782


select column1 as alias_column1, avg( table2.column2 alias_column2 , param2 ), table1.column1 alias_column1 from ( select table2.column2, sum( db1.table1.column1 alias_column1 , param2 ), * from table1, table1, db.table1 where db1.table1.column1 alias_column1 >= 6210 AND table1.column1 as alias_column1 like "u_fake" AND column1 as alias_column1 != "g_fake" order by table1.column1 as alias_column1, db2.table2.column2 desc, table1.column1 alias_column1 asc limit 6206 ) where table1.column1 = "b_fake" AND table1.column1 as alias_column1 > 2591 AND column1 <= 6710 order by db2.table2.column2, table2.column2 desc, column1 alias_column1 asc limit 6098 , 4004 union select column1 as alias_column1, length( table1.column1 as alias_column1 , param2 ), column1 alias_column1 from table1, table1, table1 where table1.column1 alias_column1 is null AND table1.column1 = 8318 AND db1.table1.column1 >= "b_fake" order by column1 alias_column1, column1 alias_column1 desc, column1 asc limit 4334 , 3187

select * from ( select * from test )

select * from ( select * from test )

select * from ( select * from test )

select column1, avg( param2 ), table1.column1 from ( select table2.column2, * from table1 where column1 as alias_column1 != "g_fake" order by table1.column1 asc limit 6206 )
 where column1 <= 6710
 order by column1 asc limit 6098 , 4004
union select column1 as alias_column1, length( table1.column1 as alias_column1 , param2 ), column1 alias_column1 from table1, table1, table1 where table1.column1 alias_column1 is null AND table1.column1 = 8318 AND db1.table1.column1 >= "b_fake" order by column1 alias_column1, column1 alias_column1 desc, column1 asc limit 4334 , 3187


SELECT db1.table1.column1 , LENGTH( db1.table1.column1 alias_column1 , param2 ) , db1.table1.column1 alias_column1 FROM ( SELECT table1.column1 alias_column1 , YEAR( db1.table1.column1 alias_column1 , param2 ) , table1.column1 alias_column1 FROM table1 , table1 , table1 WHERE column1 alias_column1 >= 8523 AND db1.table1.column1 IS NULL AND table1.column1 alias_column1 = 6280 ORDER BY column1 AS alias_column1 , table1.column1 DESC , table1.column1 ASC LIMIT 1831 ) WHERE table2.column2 alias_column2 <= "x_fake" AND table1.column1 AS alias_column1 LIKE 5405 AND db2.table2.column2 > "o_fake" ORDER BY db2.table2.column2 , db1.table1.column1 alias_column1 DESC , column1 alias_column1 ASC LIMIT 8254 UNION SELECT table1.column1 alias_column1 , UPPER(db2.table2.column2 , param2) , * FROM table1 , db.table1 , db.table1 WHERE table1.column1 AS alias_column1 > "a_fake" AND db1.table1.column1 >= "p_fake" AND table2.column2 alias_column2 > 6110 ORDER BY column1 AS alias_column1 , db1.table1.column1 alias_column1 DESC , table1.column1 alias_column1 ASC LIMIT 3225 ;

select * from test having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;

SELECT COUNT(*) AS count, AVG(balance) AS average_balance, SUM(balance) AS sum_balance FROM elasticsearch where (age >= 27 and age <= 30) or city like 'a%' group by gender, age

SELECT COUNT( s )
FROM table_name
WHERE ( id > 6 AND id < 87 AND id > 23 AND id < 87 ) OR ( id>19 ) ;


SELECT COUNT( s ) FROM table_name WHERE ( id > 6 AND id < 87 AND id > 23 AND id < 87 ) OR ( id>19 ) ;

SELECT * FROM Persons WHERE LastName IN ('Adams','Carter');


SELECT * FROM Persons WHERE ( ( id > 0 ) OR ( id < 87 ) OR (id > 23) ) and ( id < 87 ) ;

SELECT * FROM Persons WHERE LastName IN ('Adams','Carter');

SELECT * FROM Persons WHERE LastName ( BETWEEN 'Adams' AND COUNT( 'Carter' ) AND test > 76 ) ;


-- update 语句还有问题
UPDATE db.sss sss ss ss s t_product_logistics
SET year_str = "2012"
WHERE id = 2 ;


SELECT A.name , C.x_id , C.xx_id , A.rr_id , SUM( B.xi / 10 ) xx , SUM( B.x ) AS xx , SUM( B.xx / 100 ) AS xx , C.xx , C.xx , A.xx
FROM xx A
LEFT JOIN xxx B ON A.x = B.xx
LEFT JOIN xxx C ON A.xxx = C.x
WHERE A.xxxx > 0 AND C.xxxx != 622 AND C.xxxx = 1 AND A.xxx = 1 AND B.xxx IS NULL
GROUP BY A.xxx ;

SELECT D.*,E.type
FROM (
       SELECT DISTINCT(C.id) order_id, B.*
       FROM (SELECT A.cc, A.name, A.ll FROM users A WHERE t = 1 AND d = 1) B
              INNER JOIN test C ON B.cc = C.cc
     ) D
       INNER JOIN dd E ON D.ee = E.cc WHERE E.d = 1 AND E.a = 5;

