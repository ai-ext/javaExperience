CREATE TABLE r03_product_probe LIKE product;
ALTER TABLE r03_product_probe
  MODIFY COLUMN name VARCHAR(180) NOT NULL;
SHOW CREATE TABLE r03_product_probe\G
DROP TABLE r03_product_probe;
