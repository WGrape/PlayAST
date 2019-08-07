
-- 测试SQL

SELECT ProductID, Total = SUM(LineTotal)
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING SUM(LineTotal) > $2000000.00 ;

---------------替换为下面这种---------------

SELECT ProductID , SUM( LineTotal ) AS Total
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING SUM( LineTotal ) > $2000000.00 ;




SELECT ProductID, AVG(OrderQty) AS AverageQuantity, SUM(LineTotal) AS Total
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING SUM(LineTotal) > $1000000.00
AND AVG(OrderQty) < 3 ;

SELECT ProductID, SUM(LineTotal) AS Total
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING COUNT(*) > 1500 ;


SELECT ProductID
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING AVG(OrderQty) > 5
ORDER BY ProductID ;

select * from(
SELECT pm.Name, AVG(ListPrice) AS 'Average List Price'
FROM Production.Product AS p
JOIN Production.ProductModel AS pm
ON p.ProductModelID = pm.ProductModelID
GROUP BY pm.Name
HAVING pm.Name LIKE 'Mountain%'
ORDER BY pm.Name ;
)


SELECT pm.Name, AVG(ListPrice) AS 'Average List Price'
FROM Production.Product AS p
JOIN Production.ProductModel AS pm
ON p.ProductModelID = pm.ProductModelID
GROUP BY pm.Name
HAVING pm.Name LIKE 'Mountain%'
ORDER BY pm.Name ;


select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;

select *, count(*) from (
  select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3
)


select (productid).dsds.dsdsds.dsdsds.dsds , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;



SELECT *
FROM
(
    SELECT * , COUNT( * )
    FROM
    (
        SELECT productid , AVG( orderqty ) AS averagequantity , SUM( linetotal ) AS total
        FROM sales.salesorderdetail
        GROUP BY productid
        HAVING SUM( linetotal ) > $1000000.00 AND AVG( orderqty ) < 3 ) ) ) )
    )
) ;

SELECT site_id , count, SUM( access_log.COUNT ) AS "nums hehe" FROM access_log GROUP BY site_id ;

SELECT site_id , SUM( access_log.count ) AS "nums hehe" FROM access_log GROUP BY site_id ;

SELECT site_id, SUM(access_log.count) AS nums FROM access_log GROUP BY site_id;

SELECT Websites.name,COUNT(access_log.aid) AS nums FROM access_log
LEFT JOIN Websites
ON access_log.site_id=Websites.id
GROUP BY Websites.name;




SELECT site_id , `cou nt` , SUM( access_log.count ) AS "nums hehe"
FROM access_log
GROUP BY site_id ;




SELECT site_id , `cou nt` , SUM( access_log.count ) AS "nums hehe"
FROM access_log
LEFT JOIN db.test
GROUP BY site_id ;


SELECT Websites.name , COUNT( access_log.aid ) AS 'nums . sd'
FROM access_log
LEFT JOIN Websites ON access_log.site_id = Websites.id
GROUP BY Websites.name ;


insert into test.test ( " age" , " _test" ) values ( 32, " hx _ ds " );

insert into test.test values ( 32, "hx _ ds " );

UPDATE test SET name = "dsds", age = 87 where id > 9 ;


UPDATE test SET name = "dsds", age > 87 where id > 9 ;

select * from ( select * from ( select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ) ) ;

