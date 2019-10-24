-- 正确SQL
select * from ( select * from test ) A join B on A.id = B.id group by A.name having sum(age) > 0 where A.id = 100 and B.id between 10 and 20 and A.name is null and B.id like '%s' ;
select * from ( select * from test A ) B union select * from ( select * from test C ) D
select * from ( select * from test A ) B union select * from ( select * from test C ) D union select * from test2 E
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


SELECT *
    FROM (
        SELECT *
            FROM (
                SELECT *
                    FROM (
                        SELECT *
                            FROM (
                                SELECT *
                                    FROM (
                                        SELECT *
                                            FROM test
                    )
                )
            )
        )
    );



SELECT *
    FROM (
        SELECT *
            FROM (
                SELECT *
                    FROM (
                        SELECT *
                            FROM (
                                SELECT *
                                    FROM (
                                        SELECT *
                                            FROM test
                                    )
                            )
                    )
            )
    );

