select * from (
select * from (
 select * from A left join t union select * from Q
) ) B
) C

update db.table set name = "eason" where id = 10;