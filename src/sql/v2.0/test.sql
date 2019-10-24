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


SELECT *
    FROM a
    INNER JOIN b ON a.id = b.id;

SELECT * FROM articles WHERE id>=(SELECT ( id FROM articles WHERE category_id = 123 ORDER BY id LIMIT 10000, 1) LIMIT 10 UNION ALL SELECT * FROM test ;




