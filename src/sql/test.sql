
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


