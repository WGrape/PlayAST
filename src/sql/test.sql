
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

select * from ( select * from ( select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ) ) ;

SELECT * FROM ( SELECT * FROM ( SELECT productid , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total FROM sales.salesorderdetail GROUP BY productid HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 )group by test.name having avg(score) > 87 ) where id > 98 ;

select * , id , name from ( select * , id , name from (  select * , name from d1.test t1 , t3  left join d2.test2 on t1.uid = t2.id group by test2.name having ( id ) > 10 where id > 0 and concat(name) = "kidel" limit 0 , 32  ) as b ) as a where id > 10 and name != "" order by id desc limit 10 , 200;

select * , id , name from ( select * , id , name from ( select * , name from d1.test t1 , t3 left join d2.test2 on t1.uid = t2.id group by test2.name having ( id ) > 10 where id > 0 and concat(name) = "kidel" limit 0 , 32 ) as b ) as a where id > 10 and name != "" order by id desc limit 10 , 200;

INSERT INTO test ( name, age ) VALUES ( "Jack", 65 )

update a set a.col=b.col from a join b on a.id=b.id

DELETE A FROM YSHA A LEFT JOIN YSHB B ON A.code=b.code WHERE b.code = "jk"

select name , age from db.users left join db.test on users.id = test.uid where id > 0 and id < 1000 order by id desc limit 5 , 100 ;

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