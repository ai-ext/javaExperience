// 원문 SQL과 외부 연습 schema 사본·추가 r03_extra의 실제 MySQL 관측이다.
export const r03AssetRoot = '../design/r03-2026-10-20/images/';
// 매번 다른 setup guard 경로가 들어가는 trace는 UI 데이터에 복제하지 않는다.
export const R03_RUNS = {
  "runtime": {
    "mysql": "8.4.11",
    "machine": "arm64",
    "os": "macos15",
    "sqlMode": "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
    "pageSize": 16384,
    "rowFormat": "dynamic",
    "charset": "utf8mb4",
    "collation": "utf8mb4_0900_ai_ci"
  },
  "source": {
    "seedCounts": {
      "member": 200,
      "category": 10,
      "product": 80,
      "product_option": 160,
      "cart_item": 120,
      "orders": 1000,
      "order_item": 2500,
      "payment": 1000,
      "delivery": 1000,
      "subscription": 150,
      "coupon": 10,
      "member_coupon": 300,
      "point_history": 1500,
      "article": 120,
      "comment": 600,
      "review": 400
    },
    "initialProduct": {
      "writer": [
        {
          "id": 1,
          "price": "9700",
          "stock": 33
        }
      ],
      "observer": [
        {
          "id": 1,
          "price": "9700",
          "stock": 33
        }
      ]
    },
    "block2": {
      "adapter": "only mysql client \\G display terminator -> ;, SQL comments removed for splitting; SQL expressions unchanged",
      "events": [
        {
          "sql": "SHOW CREATE TABLE product",
          "parameters": null,
          "rows": [
            {
              "Table": "product",
              "Create Table": "CREATE TABLE `product` (\n  `id` bigint NOT NULL AUTO_INCREMENT,\n  `category_id` bigint NOT NULL,\n  `name` varchar(160) NOT NULL,\n  `product_type` varchar(20) NOT NULL DEFAULT 'GOODS',\n  `price` decimal(12,0) NOT NULL,\n  `stock` int NOT NULL DEFAULT '0',\n  `sale_status` varchar(20) NOT NULL DEFAULT 'ON_SALE',\n  `deleted_at` datetime DEFAULT NULL,\n  `created_at` datetime NOT NULL,\n  `updated_at` datetime NOT NULL,\n  PRIMARY KEY (`id`),\n  KEY `ix_product_category_sale` (`category_id`,`sale_status`,`created_at`),\n  KEY `ix_product_stock` (`stock`),\n  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),\n  CONSTRAINT `ck_product_price_stock` CHECK (((`price` >= 0) and (`stock` >= 0))),\n  CONSTRAINT `ck_product_sale_status` CHECK ((`sale_status` in (_utf8mb4'ON_SALE',_utf8mb4'SOLD_OUT',_utf8mb4'HIDDEN'))),\n  CONSTRAINT `ck_product_type` CHECK ((`product_type` in (_utf8mb4'GOODS',_utf8mb4'MAGAZINE',_utf8mb4'EBOOK',_utf8mb4'CARTOON')))\n) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='원본: E2 ProdMst, E4 prod, E5 tb_ebook/tb_ecartoon; 재고·판매상태를 타입화'"
            }
          ],
          "affectedRows": null
        },
        {
          "sql": "SELECT table_name, column_name, column_type, is_nullable, column_default\nFROM information_schema.columns\nWHERE table_schema = DATABASE()\n  AND table_name IN ('member', 'product', 'orders', 'order_item', 'review')\nORDER BY table_name, ordinal_position",
          "parameters": null,
          "rows": [
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "login_id",
              "COLUMN_TYPE": "varchar(50)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "name",
              "COLUMN_TYPE": "varchar(80)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "email",
              "COLUMN_TYPE": "varchar(160)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "phone",
              "COLUMN_TYPE": "varchar(30)",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "member_status",
              "COLUMN_TYPE": "varchar(20)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": "ACTIVE"
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "deleted_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "created_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "member",
              "COLUMN_NAME": "updated_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "order_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "product_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "product_option_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "quantity",
              "COLUMN_TYPE": "int",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "unit_price",
              "COLUMN_TYPE": "decimal(12,0)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "item_status",
              "COLUMN_TYPE": "varchar(20)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "created_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "order_item",
              "COLUMN_NAME": "updated_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "order_no",
              "COLUMN_TYPE": "varchar(30)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "member_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "order_status",
              "COLUMN_TYPE": "varchar(20)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "total_amount",
              "COLUMN_TYPE": "decimal(12,0)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "ordered_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "canceled_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "deleted_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "created_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "orders",
              "COLUMN_NAME": "updated_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "category_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "name",
              "COLUMN_TYPE": "varchar(160)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "product_type",
              "COLUMN_TYPE": "varchar(20)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": "GOODS"
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "price",
              "COLUMN_TYPE": "decimal(12,0)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "stock",
              "COLUMN_TYPE": "int",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": "0"
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "sale_status",
              "COLUMN_TYPE": "varchar(20)",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": "ON_SALE"
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "deleted_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "created_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "product",
              "COLUMN_NAME": "updated_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "product_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "member_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "order_item_id",
              "COLUMN_TYPE": "bigint",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "rating",
              "COLUMN_TYPE": "tinyint",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "body",
              "COLUMN_TYPE": "varchar(2000)",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "deleted_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "YES",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "created_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            },
            {
              "TABLE_NAME": "review",
              "COLUMN_NAME": "updated_at",
              "COLUMN_TYPE": "datetime",
              "IS_NULLABLE": "NO",
              "COLUMN_DEFAULT": null
            }
          ],
          "affectedRows": null
        }
      ]
    },
    "block3": {
      "adapter": "only mysql client \\G display terminator -> ;, SQL comments removed for splitting; SQL expressions unchanged",
      "events": [
        {
          "sql": "CREATE TABLE r03_product_probe LIKE product",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        },
        {
          "sql": "ALTER TABLE r03_product_probe\n  MODIFY COLUMN name VARCHAR(180) NOT NULL",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        },
        {
          "sql": "SHOW CREATE TABLE r03_product_probe",
          "parameters": null,
          "rows": [
            {
              "Table": "r03_product_probe",
              "Create Table": "CREATE TABLE `r03_product_probe` (\n  `id` bigint NOT NULL AUTO_INCREMENT,\n  `category_id` bigint NOT NULL,\n  `name` varchar(180) NOT NULL,\n  `product_type` varchar(20) NOT NULL DEFAULT 'GOODS',\n  `price` decimal(12,0) NOT NULL,\n  `stock` int NOT NULL DEFAULT '0',\n  `sale_status` varchar(20) NOT NULL DEFAULT 'ON_SALE',\n  `deleted_at` datetime DEFAULT NULL,\n  `created_at` datetime NOT NULL,\n  `updated_at` datetime NOT NULL,\n  PRIMARY KEY (`id`),\n  KEY `ix_product_category_sale` (`category_id`,`sale_status`,`created_at`),\n  KEY `ix_product_stock` (`stock`),\n  CONSTRAINT `r03_product_probe_chk_1` CHECK (((`price` >= 0) and (`stock` >= 0))),\n  CONSTRAINT `r03_product_probe_chk_2` CHECK ((`sale_status` in (_utf8mb4'ON_SALE',_utf8mb4'SOLD_OUT',_utf8mb4'HIDDEN'))),\n  CONSTRAINT `r03_product_probe_chk_3` CHECK ((`product_type` in (_utf8mb4'GOODS',_utf8mb4'MAGAZINE',_utf8mb4'EBOOK',_utf8mb4'CARTOON')))\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='원본: E2 ProdMst, E4 prod, E5 tb_ebook/tb_ecartoon; 재고·판매상태를 타입화'"
            }
          ],
          "affectedRows": null
        },
        {
          "sql": "DROP TABLE r03_product_probe",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        }
      ]
    },
    "block4": {
      "adapter": "only mysql client \\G display terminator -> ;, SQL comments removed for splitting; SQL expressions unchanged",
      "events": [
        {
          "sql": "START TRANSACTION",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        },
        {
          "sql": "UPDATE product SET price = -1 WHERE id = 1",
          "parameters": null,
          "error": {
            "code": 3819,
            "message": "Check constraint 'ck_product_price_stock' is violated."
          }
        },
        {
          "sql": "ROLLBACK",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        }
      ]
    },
    "block5": {
      "adapter": "only mysql client \\G display terminator -> ;, SQL comments removed for splitting; SQL expressions unchanged",
      "events": [
        {
          "sql": "SELECT\n  CAST(0.1 AS DOUBLE) + CAST(0.2 AS DOUBLE) = CAST(0.3 AS DOUBLE) AS double_equal,\n  CAST(0.1 AS DECIMAL(2,1)) + CAST(0.2 AS DECIMAL(2,1))\n    = CAST(0.3 AS DECIMAL(2,1)) AS decimal_equal",
          "parameters": null,
          "rows": [
            {
              "double_equal": 0,
              "decimal_equal": 1
            }
          ],
          "affectedRows": null
        },
        {
          "sql": "START TRANSACTION",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        },
        {
          "sql": "UPDATE product SET price = price + 1 WHERE id = 1",
          "parameters": null,
          "rows": null,
          "affectedRows": 1
        },
        {
          "additionalIndependentObservationAfterUpdate": {
            "writer": [
              {
                "id": 1,
                "price": "9701",
                "stock": 33
              }
            ],
            "observer": [
              {
                "id": 1,
                "price": "9700",
                "stock": 33
              }
            ]
          }
        },
        {
          "sql": "SELECT id, price FROM product WHERE id = 1",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "price": "9701"
            }
          ],
          "affectedRows": null
        },
        {
          "sql": "ROLLBACK",
          "parameters": null,
          "rows": null,
          "affectedRows": 0
        },
        {
          "sql": "SELECT id, price FROM product WHERE id = 1",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "price": "9700"
            }
          ],
          "affectedRows": null
        }
      ]
    },
    "afterRollback": {
      "writer": [
        {
          "id": 1,
          "price": "9700",
          "stock": 33
        }
      ],
      "observer": [
        {
          "id": 1,
          "price": "9700",
          "stock": 33
        }
      ]
    }
  },
  "extra": {
    "varchar": [
      {
        "label": "ASCII",
        "characters": 255,
        "bytes": 255
      },
      {
        "label": "KOREAN",
        "characters": 255,
        "bytes": 765
      },
      {
        "label": "EMOJI",
        "characters": 255,
        "bytes": 1020
      }
    ],
    "varcharTooLong": {
      "sql": "INSERT INTO text_probe VALUES (4,'TOO_LONG',%s)",
      "parameters": [
        "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      ],
      "error": {
        "code": 1406,
        "message": "Data too long for column 'value' at row 1"
      }
    },
    "varcharMetadata": [
      {
        "chars": 255,
        "bytes": 1020
      }
    ],
    "nullableNegative": {
      "sql": "INSERT INTO nullable_check VALUES(2,-1)",
      "parameters": null,
      "error": {
        "code": 3819,
        "message": "Check constraint 'ck_probe_price' is violated."
      }
    },
    "nullableCheck": [
      {
        "id": 1,
        "price": null,
        "predicate": null
      }
    ],
    "requiredNull": {
      "sql": "INSERT INTO required_default VALUES(2,NULL,10)",
      "parameters": null,
      "error": {
        "code": 1048,
        "message": "Column 'stock' cannot be null"
      }
    },
    "missingRequired": {
      "sql": "INSERT INTO required_default(id)VALUES(3)",
      "parameters": null,
      "error": {
        "code": 1364,
        "message": "Field 'price' doesn't have a default value"
      }
    },
    "default": [
      {
        "id": 1,
        "stock": 0,
        "price": 10
      }
    ],
    "uniqueDuplicate": {
      "sql": "INSERT INTO unique_probe VALUES(4,'a@example.invalid')",
      "parameters": null,
      "error": {
        "code": 1062,
        "message": "Duplicate entry 'a@example.invalid' for key 'unique_probe.email'"
      }
    },
    "uniqueNulls": [
      {
        "nullRows": 2
      }
    ],
    "pkDuplicate": {
      "sql": "INSERT INTO unique_probe VALUES(1,NULL)",
      "parameters": null,
      "error": {
        "code": 1062,
        "message": "Duplicate entry '1' for key 'unique_probe.PRIMARY'"
      }
    },
    "pkNull": {
      "sql": "INSERT INTO unique_probe VALUES(NULL,NULL)",
      "parameters": null,
      "error": {
        "code": 1048,
        "message": "Column 'id' cannot be null"
      }
    },
    "boolean": [
      {
        "id": 1,
        "loose": 2,
        "closed": 1
      }
    ],
    "booleanClosed": {
      "sql": "INSERT INTO bool_probe VALUES(2,1,2)",
      "parameters": null,
      "error": {
        "code": 3819,
        "message": "Check constraint 'bool_probe_chk_1' is violated."
      }
    },
    "sourceBoolean2": {
      "sql": "UPDATE ds_practice.subscription SET auto_renew=2 WHERE id=1",
      "parameters": null,
      "rows": null,
      "affectedRows": 1
    },
    "sourceBooleanValue": [
      {
        "id": 1,
        "auto_renew": 2
      }
    ],
    "sourceFkChild": {
      "sql": "UPDATE ds_practice.orders SET member_id=999999 WHERE id=1",
      "parameters": null,
      "error": {
        "code": 1452,
        "message": "Cannot add or update a child row: a foreign key constraint fails (`ds_practice`.`orders`, CONSTRAINT `fk_orders_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`))"
      }
    },
    "sourceFkParent": {
      "sql": "DELETE FROM ds_practice.member WHERE id=1",
      "parameters": null,
      "error": {
        "code": 1451,
        "message": "Cannot delete or update a parent row: a foreign key constraint fails (`ds_practice`.`article`, CONSTRAINT `fk_article_author` FOREIGN KEY (`author_id`) REFERENCES `member` (`id`))"
      }
    },
    "fkMismatch": {
      "sql": "CREATE TABLE child_bad(id INT PRIMARY KEY,parent_id BIGINT UNSIGNED,FOREIGN KEY(parent_id)REFERENCES parent_probe(id))",
      "parameters": null,
      "error": {
        "code": 3780,
        "message": "Referencing column 'parent_id' and referenced column 'id' in foreign key constraint 'child_bad_ibfk_1' are incompatible."
      }
    },
    "referentialActions": {
      "cascade": [],
      "setNull": [
        {
          "id": 1,
          "parent_id": null
        }
      ]
    },
    "key769": {
      "sql": "CREATE TABLE key769(value VARCHAR(769) NOT NULL,UNIQUE KEY uk(value)) ENGINE=InnoDB ROW_FORMAT=DYNAMIC",
      "parameters": null,
      "error": {
        "code": 1071,
        "message": "Specified key was too long; max key length is 3072 bytes"
      }
    },
    "keyComposite": {
      "sql": "CREATE TABLE key800(a VARCHAR(400) NOT NULL,b VARCHAR(400) NOT NULL,UNIQUE KEY uk(a,b)) ENGINE=InnoDB ROW_FORMAT=DYNAMIC",
      "parameters": null,
      "error": {
        "code": 1071,
        "message": "Specified key was too long; max key length is 3072 bytes"
      }
    },
    "ddl": {
      "observerBeforeCreate": [],
      "observerAfterCreate": [
        {
          "id": 1
        }
      ],
      "markerAfterRollback": [
        {
          "id": 1
        }
      ],
      "createdTableAfterRollback": [
        {
          "TABLE_NAME": "ddl_created"
        }
      ]
    },
    "timezones": {
      "utc": [
        {
          "id": 1,
          "d": "2026-10-20",
          "dt": "2026-10-20 00:00:00",
          "ts": "2026-10-20 00:00:00"
        }
      ],
      "plus09": [
        {
          "id": 1,
          "d": "2026-10-20",
          "dt": "2026-10-20 00:00:00",
          "ts": "2026-10-20 09:00:00"
        }
      ]
    },
    "timestampRange": {
      "sql": "INSERT INTO time_probe VALUES(2,'2040-01-01','2040-01-01 00:00:00','2040-01-01 00:00:00')",
      "parameters": null,
      "error": {
        "code": 1292,
        "message": "Incorrect datetime value: '2040-01-01 00:00:00' for column 'ts' at row 1"
      }
    }
  },
  "checks": [
    "native-8.4.11-arm64-private-no-tcp",
    "original-seed-16-tables",
    "source-product1-price9700-stock33",
    "source-check-negative-price-error3819",
    "source-like-alter-name180-drop",
    "like-keeps-check-index-omits-fk",
    "source-double0-decimal1",
    "source-update-writer9701-observer9700",
    "source-rollback9700-both",
    "varchar255-character-vs-payload",
    "varchar256-strict-error1406",
    "varchar-declared-max-255-1020",
    "nullable-check-negative3819",
    "check-null-unknown-allowed",
    "not-null-error1048",
    "missing-required-error1364",
    "omitted-stock-default0",
    "unique-non-null-duplicate1062",
    "unique-allows-two-null",
    "primary-duplicate1062",
    "primary-null1048",
    "boolean-alias-allows2-without-check",
    "boolean-domain-check3819",
    "source-subscription-no-01-check",
    "source-invalid-member-fk1452",
    "source-parent-delete1451",
    "fk-signedness-mismatch3780",
    "extra-cascade-vs-set-null",
    "unique-varchar769-error1071",
    "unique-composite800-error1071",
    "key768-3072-on-page16384",
    "ddl-implicit-commits-prior-dml",
    "ddl-not-undone-by-user-rollback",
    "timestamp-converts-datetime-unchanged",
    "timestamp-2040-out-of-range1292"
  ]
};
export const r03Run=path=>path.split('.').reduce((object,key)=>object?.[key],R03_RUNS);
const stage=(topic,id,title,lead,code,values,checks=[],runKeys=[],extra={})=>({id:topic+'-'+id,title,lead,code,values,checks,runKeys,active:[0],image:'R03-'+topic,...extra});
const scope='실제 격리 native MySQL 8.4.11 / PyMySQL 1.1.2 · 별도 datadir/socket · skip-networking / mysqlx OFF';
const limits='원문 bash 접속 명령·HTTP·Java/JPA·Docker는 미실행입니다. 물리 파일/page 내부·속도는 측정하지 않았습니다.';
const sourceNote='원문 SQL2~5는 외부 공부자료 schema/seed 사본을 새 MySQL 인스턴스에 적재한 ds_practice에서 실행했습니다. 저장소 practice나 기존 학습자 DB를 바꾼 결과가 아닙니다.';
const extraNote='r03_extra는 원문 ds_practice와 분리한 추가 실험 schema입니다. 각 오류·행은 이 MySQL 8.4.11 설정의 관측입니다.';
const varcharSelect='SELECT label,CHAR_LENGTH(value) AS characters,OCTET_LENGTH(value) AS bytes\nFROM text_probe ORDER BY id';
export const R03_LESSONS=[
 {id:'schema',question:'복사 테이블을 바꾸면 원래 product도 바뀔까?',source:scope+' · 원문 SQL2/3',sourceNote,note:'원문 mysql 클라이언트의 표시 명령 \\G만 서버 전송 시 ;로 바꾸고, 분할용 SQL 주석을 제거했습니다. SQL 표현식은 유지했습니다. CREATE TABLE LIKE는 이 관측에서 CHECK·인덱스를 유지하고 FK는 복사하지 않았습니다. '+limits,stages:[
  stage('schema','source','먼저 원래 product 정의 읽기','별도 인스턴스의 ds_practice에 외부 연습 사본 16개 테이블을 적재했습니다. product1의 초기 price는9700·stock33이며 SHOW CREATE TABLE에서 컬럼·제약을 읽었습니다.','SHOW CREATE TABLE product\\G',[['실제 runtime','MySQL 8.4.11 · arm64 · TCP 비활성화'],['연습 사본','16개 테이블 · product 80행'],['원래 product.name','VARCHAR(160) NOT NULL'],['초기 product1','price=9700 / stock=33']],['native-8.4.11-arm64-private-no-tcp','original-seed-16-tables','source-product1-price9700-stock33'],['runtime','source.seedCounts','source.initialProduct','source.block2.events.0']),
  stage('schema','copy','LIKE 복사본만 name180으로','원문은 빈 r03_product_probe를 만든 뒤 name을180자로 바꿨습니다. 실제 SHOW CREATE에는 CHECK·인덱스가 있으나 원래 product의 FK는 복사되지 않았습니다.','CREATE TABLE r03_product_probe LIKE product;\nALTER TABLE r03_product_probe\n  MODIFY COLUMN name VARCHAR(180) NOT NULL;\nSHOW CREATE TABLE r03_product_probe\\G',[['변경 대상','r03_product_probe · 빈 복사본'],['복사본 name','VARCHAR(180) NOT NULL'],['유지된 정의','CHECK / PK·인덱스'],['복사하지 않은 정의','FOREIGN KEY']],['like-keeps-check-index-omits-fk'],['source.block3.events.0','source.block3.events.1','source.block3.events.2'],{active:[0,1,2,3]}),
  stage('schema','drop','DROP 뒤 복사본 없음','원문 DROP은 r03_product_probe만 제거했습니다. information_schema에서 같은 복사본 테이블 수가0임을 확인했으며 기존 연결·서버의 삭제 작업은 실행하지 않았습니다.','DROP TABLE r03_product_probe;',[['DROP 대상','r03_product_probe'],['삭제 뒤 해당 테이블 수','0'],['실행 범위','새 인스턴스의 연습 사본 · 기존 학습자 DB 아님']],['source-like-alter-name180-drop'],['source.block3.events.3']),
 ]},
 {id:'varchar',question:'VARCHAR(255)는 255바이트일까?',source:scope+' · 추가 r03_extra.text_probe',sourceNote:extraNote,note:'추가 컬럼 value는 utf8mb4 VARCHAR(255)입니다. CHAR_LENGTH는 문자 수, OCTET_LENGTH는 값의 데이터 바이트 수입니다. 접두사·행 전체·실제 파일 크기와 같지 않으며 저장소 공간을 측정한 결과가 아닙니다. '+limits,stages:[
  stage('varchar','ascii','ASCII 255자는255바이트','추가 입력 a를255번 반복한 값을 저장했습니다. 같은 선언 길이255 안에서 문자 수255·payload255바이트를 확인했습니다.',varcharSelect,[['추가 입력','ASCII · a 255개'],['CHAR_LENGTH','255'],['OCTET_LENGTH','255 bytes'],['컬럼 선언','VARCHAR(255) · utf8mb4']],['varchar255-character-vs-payload'],['extra.varchar.0']),
  stage('varchar','korean','한글 255자는765바이트','추가 입력 가255개는 같은 컬럼에 들어갔습니다. 문자 수는255지만 이 한글 값의 payload는765바이트였습니다.',varcharSelect,[['추가 입력','KOREAN · 가 255개'],['CHAR_LENGTH','255'],['OCTET_LENGTH','765 bytes']],['varchar255-character-vs-payload'],['extra.varchar.1']),
  stage('varchar','emoji','이모지255자는1020바이트','추가 입력 😀255개도 문자 상한 안에 있습니다. 값은1020바이트였고 metadata의 문자 상한255·최대 바이트1020도 확인했습니다.',varcharSelect,[['추가 입력','EMOJI · 😀 255개'],['CHAR_LENGTH','255'],['OCTET_LENGTH','1020 bytes'],['metadata chars / bytes','255 / 1020']],['varchar255-character-vs-payload','varchar-declared-max-255-1020'],['extra.varchar.2','extra.varcharMetadata']),
  stage('varchar','overflow','한글256자는 strict 오류','추가 가256개를 PyMySQL 파라미터로 전달했습니다. STRICT_TRANS_TABLES가 켜진 이 실행에서 값이 잘려 저장되지 않고 오류1406으로 거부됐습니다.',"INSERT INTO text_probe VALUES (4,'TOO_LONG',%s)\n-- PyMySQL 파라미터: '가' * 256",[['입력 문자 수','256 · 가 반복'],['선언 상한','255문자'],['실측 오류','1406 · Data too long for column value'],['SQL mode','STRICT_TRANS_TABLES 포함']],['varchar256-strict-error1406'],['extra.varcharTooLong','runtime']),
 ]},
 {id:'nullable',question:'CHECK·NOT NULL·DEFAULT는 같은 규칙일까?',source:scope+' · 원문 product CHECK / 추가 nullable_check·required_default',sourceNote:extraNote+' 원문 product 음수 UPDATE와 추가 nullable_check INSERT를 구분합니다.',note:'CHECK 결과 UNKNOWN은 위반으로 거부되지 않습니다. NOT NULL은 NULL을 막고 DEFAULT는 생략값을 정합니다. source와 extra의 제약 이름·테이블을 섞지 않습니다. '+limits,stages:[
  stage('nullable','unknown','NULL 비교는UNKNOWN으로 통과','추가 nullable_check.price에는 NOT NULL이 없습니다. NULL을 넣은 뒤 price>=0은NULL로 읽혔고 행은 저장돼 있습니다.','INSERT INTO nullable_check VALUES(1,NULL);\nSELECT id,price,price>=0 AS predicate FROM nullable_check;',[['추가 테이블','nullable_check · price nullable'],['저장 price','NULL'],['price>=0 결과','NULL · UNKNOWN'],['실측 행','id=1 / price=NULL']],['check-null-unknown-allowed'],['extra.nullableCheck'],{active:[0,1]}),
  stage('nullable','negative','음수는 두 CHECK에서3819','추가 nullable_check의 -1 INSERT와 원문 product의 price=-1 UPDATE는 각각 CHECK 오류3819였습니다. 원문 UPDATE는 별도 명시 transaction에서 실행한 뒤 rollback했습니다.','INSERT INTO nullable_check VALUES(2,-1);\n-- 별도 원문 SQL4\nSTART TRANSACTION;\nUPDATE product SET price = -1 WHERE id = 1;\nROLLBACK;',[['추가 오류','3819 · ck_probe_price'],['원문 오류','3819 · ck_product_price_stock'],['원문 대상','product id1 · price=-1 거부']],['nullable-check-negative3819','source-check-negative-price-error3819'],['extra.nullableNegative','source.block4'],{active:[0,3]}),
  stage('nullable','default','stock 생략은DEFAULT0','추가 required_default에서 stock을 생략하고 price10을 넣었습니다. stock은 선언한 기본값0으로 저장됐습니다.','CREATE TABLE required_default (id INT PRIMARY KEY, stock INT NOT NULL DEFAULT 0, price INT NOT NULL CHECK(price>=0));\nINSERT INTO required_default(id,price)VALUES(1,10);',[['생략한 컬럼','stock'],['저장 행','id=1 / stock=0 / price=10'],['규칙','DEFAULT 0 · NULL 입력과 별개']],['omitted-stock-default0'],['extra.default'],{active:[0,1]}),
  stage('nullable','required','명시NULL과 필수값 생략은 거부','같은 추가 테이블에서 stock에 명시NULL을 넣으면1048입니다. 기본값 없는 필수 price를 생략한 다른 INSERT는1364로 거부됐습니다.','INSERT INTO required_default VALUES(2,NULL,10);\nINSERT INTO required_default(id)VALUES(3);',[['명시 stock=NULL','1048 · cannot be null'],['price 생략','1364 · no default value'],['구분','NULL 금지 / 기본값 없는 필수값 누락']],['not-null-error1048','missing-required-error1364'],['extra.requiredNull','extra.missingRequired'],{active:[0,1]}),
 ]},
 {id:'identity',question:'UNIQUE·PK·BOOLEAN은 무엇을 허용할까?',source:scope+' · 추가 unique_probe/bool_probe + 연습 사본 subscription',sourceNote:'unique_probe는 nullable UNIQUE email과 AUTO_INCREMENT가 없는 PRIMARY KEY id를 가진 추가 테이블입니다. 연습 subscription과 추가 BOOL 테이블도 별개입니다.',note:'BOOLEAN 별칭만으로0/1 범위가 닫히지 않습니다. 원래 subscription.auto_renew에는0/1 CHECK가 없어2가 통과했고 이 변경은 rollback했습니다. '+limits,stages:[
  stage('identity','nulls','nullable UNIQUE는NULL 둘 허용','추가 email UNIQUE 컬럼에 NULL인 두 행과 값이 있는 한 행을 넣었습니다. NULL 행 수는2였습니다.',"CREATE TABLE unique_probe(id BIGINT PRIMARY KEY,email VARCHAR(160) NULL UNIQUE);\nINSERT INTO unique_probe VALUES(1,NULL),(2,NULL),(3,'a@example.invalid');",[['UNIQUE 컬럼','email · NULL 허용'],['NULL 행 수','2'],['추가 입력','id1 NULL / id2 NULL / id3 a@example.invalid']],['unique-allows-two-null'],['extra.uniqueNulls'],{active:[0,1]}),
  stage('identity','duplicate','같은 비NULL 값은1062','이미 있는 a@example.invalid를 다른 id4로 넣었습니다. PRIMARY KEY가 다른 경우에도 email UNIQUE가 중복값을 거부했습니다.',"INSERT INTO unique_probe VALUES(4,'a@example.invalid');",[['충돌한 값','a@example.invalid'],['실측 오류','1062 · unique_probe.email'],['별도 PK 입력','4']],['unique-non-null-duplicate1062'],['extra.uniqueDuplicate']),
  stage('identity','primary','이 PK는 중복·NULL 거부','AUTO_INCREMENT가 없는 추가 id PRIMARY KEY에서 id1 중복은1062, NULL 입력은1048이었습니다. AUTO_INCREMENT의 NULL 입력 규칙을 시험한 것이 아닙니다.','INSERT INTO unique_probe VALUES(1,NULL);\nINSERT INTO unique_probe VALUES(NULL,NULL);',[['id1 중복','1062 · unique_probe.PRIMARY'],['id=NULL','1048 · id cannot be null'],['추가 PK 설정','BIGINT PRIMARY KEY · AUTO_INCREMENT 없음']],['primary-duplicate1062','primary-null1048'],['extra.pkDuplicate','extra.pkNull'],{active:[0,1]}),
  stage('identity','boolean','BOOLEAN만으로는2를 막지 않음','연습 사본 subscription.auto_renew=2 UPDATE가 통과했고 rollback했습니다. 별도 bool_probe에서도 loose=2는 통과하지만 CHECK가 있는 closed=2는3819였습니다.','UPDATE ds_practice.subscription SET auto_renew=2 WHERE id=1;\n-- 위 사본 변경은 ROLLBACK\n-- 별도 추가 BOOL 실험\nINSERT INTO bool_probe VALUES(1,2,1);\nINSERT INTO bool_probe VALUES(2,1,2);',[['연습 사본 auto_renew','2 통과 · 이후 rollback'],['추가 bool_probe 성공 행','loose=2 / closed=1'],['closed CHECK','closed IN(0,1)'],['closed=2 오류','3819']],['source-subscription-no-01-check','boolean-alias-allows2-without-check','boolean-domain-check3819'],['extra.sourceBoolean2','extra.sourceBooleanValue','extra.boolean','extra.booleanClosed'],{active:[0,3,4]}),
 ]},
 {id:'foreign',question:'FK는 잘못된 참조와 부모 삭제를 어떻게 막을까?',source:scope+' · 연습 사본 FK / 추가 parent_probe 관계',sourceNote:'연습 사본의 orders/member/article과 추가 parent_probe/cascade_probe/null_probe를 구분합니다. 원본 외부 공부자료나 기존 서버의 행을 바꾸지 않았습니다.',note:'오류의 실제 제약 이름을 확인합니다. signedness mismatch·CASCADE·SET NULL은 r03_extra의 독립 추가 실험입니다. '+limits,stages:[
  stage('foreign','child','없는 member 참조는1452','연습 사본 orders id1의 member_id를999999로 바꾸려 했습니다. fk_orders_member가 참조 없는 자식 변경을 거부했고 transaction을 rollback했습니다.','UPDATE ds_practice.orders SET member_id=999999 WHERE id=1;',[['대상','사본 orders id1'],['잘못된 member_id','999999'],['실측 오류','1452 · fk_orders_member']],['source-invalid-member-fk1452'],['extra.sourceFkChild']),
  stage('foreign','parent','참조 중인 member 삭제는1451','사본 member id1 삭제는 실제로 article.author_id의 fk_article_author에서 거부됐습니다. 이 오류를 orders FK라고 바꾸어 표시하지 않습니다.','DELETE FROM ds_practice.member WHERE id=1;',[['대상','사본 member id1'],['실제 참조 경로','article.author_id → member.id'],['실측 오류','1451 · fk_article_author']],['source-parent-delete1451'],['extra.sourceFkParent']),
  stage('foreign','actions','부호 불일치와 삭제 동작 비교','추가 signed BIGINT 부모와 UNSIGNED 자식 FK는3780으로 거부됐습니다. 별도 올바른 관계에서 부모 삭제 뒤 CASCADE 자식은 없고 SET NULL 자식은 parent_id=NULL로 남았습니다.','CREATE TABLE child_bad(id INT PRIMARY KEY,parent_id BIGINT UNSIGNED,FOREIGN KEY(parent_id)REFERENCES parent_probe(id));\n-- 별도 올바른 CASCADE/SET NULL 관계의 부모 삭제\nDELETE FROM parent_probe WHERE id=1;',[['추가 타입 불일치','BIGINT ↔ BIGINT UNSIGNED · 오류3780'],['CASCADE 결과','자식 행 []'],['SET NULL 결과','id=1 / parent_id=NULL']],['fk-signedness-mismatch3780','extra-cascade-vs-set-null'],['extra.fkMismatch','extra.referentialActions'],{active:[0,2]}),
 ]},
 {id:'money',question:'정확한 금액과 commit 전후 관찰은 어떻게 다를까?',source:scope+' · 원문 SQL5 + 별도 observer',sourceNote:sourceNote+' 원문 금액 SQL의 transaction 안에 추가 독립 observer 관찰만 넣었습니다.',note:'DOUBLE/DECIMAL은 실제 비교 결과를 보여 줍니다. 원문의 product.price는 DECIMAL(12,0)이며 바이트·금액 처리 속도를 측정한 것이 아닙니다. '+limits,stages:[
  stage('money','compare','DOUBLE 비교0·DECIMAL 비교1','원문 CAST 비교 쿼리를 실행했습니다. DOUBLE의0.1+0.2=0.3은0, DECIMAL(2,1)의 같은 비교는1이었습니다.',R03_RUNS.source.block5.events[0].sql,[['double_equal','0'],['decimal_equal','1'],['의미','이 입력·타입의 실제 equality 결과']],['source-double0-decimal1'],['source.block5.events.0']),
  stage('money','update','UPDATE 뒤 writer9701','원문 product id1의 가격을1 올렸습니다. 같은 transaction의 writer SELECT는9701을 읽었고 stock은33으로 관찰됐습니다.','START TRANSACTION;\nUPDATE product SET price = price + 1 WHERE id = 1;\nSELECT id, price FROM product WHERE id = 1;',[['원래 product1','price=9700 / stock=33'],['UPDATE affectedRows','1'],['같은 transaction writer','price=9701 / stock=33']],['source-update-writer9701-observer9700'],['source.block5.events.2','source.block5.events.3','source.block5.events.4'],{active:[1,2]}),
  stage('money','observer','같은 관측의 observer는9700','앞 장면의 추가 관측에서 별도 READ_COMMITTED·autocommit observer는9700을 읽었습니다. writer9701과 같은 시점의 다른 연결 관찰이며 commit한 가격이 아닙니다.','SELECT id, price, stock FROM ds_practice.product WHERE id=1\n-- 같은 문장을 writer와 별도 observer 연결에서 각각 실행',[['writer 가격','9701'],['별도 observer 가격','9700'],['구분','같은 transaction / 독립 READ_COMMITTED 연결']],['source-update-writer9701-observer9700'],['source.block5.events.3']),
  stage('money','rollback','ROLLBACK 뒤 양쪽9700','원문 rollback 뒤 같은 연결의 SELECT와 추가 observer가 모두9700을 읽었습니다. 초기 product1의 stock33도 유지됐습니다.','ROLLBACK;\nSELECT id, price FROM product WHERE id = 1;',[['rollback 뒤 writer','price=9700 / stock=33'],['rollback 뒤 observer','price=9700 / stock=33'],['관측 범위','격리 인스턴스의 ds_practice 사본']],['source-rollback9700-both'],['source.block5.events.5','source.block5.events.6','source.afterRollback'],{active:[0,1]}),
 ]},
 {id:'ddl',question:'CREATE TABLE 전에 쓴 행도 ROLLBACK으로 취소될까?',source:scope+' · 추가 r03_extra.ddl_marker/ddl_created',sourceNote:extraNote+' 이 주제는 원문 복사 테이블과 별도의 DDL 암묵 commit probe입니다.',note:'여기의 비임시 CREATE TABLE에 대한 관측입니다. 모든 DDL·임시 테이블·다른 DB까지 같은 규칙으로 일반화하지 않습니다. '+limits,stages:[
  stage('ddl','before','INSERT 후 observer는빈 결과','추가 transaction에서 ddl_marker id1을 넣었습니다. 뒤의 CREATE TABLE을 실행하기 전 observer는 아직 행을 읽지 못했습니다.','START TRANSACTION;\nINSERT INTO ddl_marker VALUES(1);',[['추가 writer 작업','ddl_marker id1 INSERT'],['CREATE 전 observer','[]'],['아직 실행 전','뒤의 CREATE TABLE ddl_created']],[],['extra.ddl.observerBeforeCreate'],{active:[0,1]}),
  stage('ddl','create','CREATE 뒤 observer에서id1','같은 흐름의 CREATE TABLE ddl_created가 실행된 뒤 observer는 ddl_marker id1을 읽었습니다. 앞선 DML이 암묵 commit된 관측입니다.','CREATE TABLE ddl_created(id INT PRIMARY KEY);',[['CREATE 뒤 observer','[{id:1}]'],['앞선 INSERT','이 CREATE 경계에서 외부 관찰 가능'],['아직 호출 전','뒤의 사용자 ROLLBACK']],['ddl-implicit-commits-prior-dml'],['extra.ddl.observerAfterCreate']),
  stage('ddl','rollback','사용자 ROLLBACK 뒤에도 남음','이후 ROLLBACK을 호출해도 marker id1은 남았고 ddl_created 테이블도 존재했습니다. DML rollback처럼 CREATE를 취소한 결과가 아닙니다.','ROLLBACK;\nSELECT * FROM ddl_marker;',[['markerAfterRollback','[{id:1}]'],['createdTableAfterRollback','ddl_created 존재'],['의미','이 CREATE는 사용자 ROLLBACK으로 취소되지 않음']],['ddl-implicit-commits-prior-dml','ddl-not-undone-by-user-rollback'],['extra.ddl.markerAfterRollback','extra.ddl.createdTableAfterRollback'],{active:[0,1]}),
 ]},
 {id:'time',question:'같은 행을 다른 세션 시간대로 읽으면 무엇이 바뀔까?',source:scope+' · 추가 r03_extra.time_probe',sourceNote:extraNote+' named Asia/Seoul 설정이 아닌 세션 고정 offset +00:00 / +09:00 비교입니다.',note:'DATE·DATETIME·TIMESTAMP 값을 같은 행에서 비교했습니다. 물리 저장 바이트를 직접 읽거나 모든 시간 범위를 검증한 실험이 아닙니다. '+limits,stages:[
  stage('time','utc','+00:00 입력·조회','세션 시간대를+00:00으로 두고 2026-10-20 00:00:00을 넣었습니다. DATE는 날짜, DATETIME과 TIMESTAMP 조회는 모두00:00:00이었습니다.',"SET SESSION time_zone='+00:00';\nINSERT INTO time_probe VALUES(1,'2026-10-20','2026-10-20 00:00:00','2026-10-20 00:00:00');",[['세션 offset','+00:00'],['DATE d','2026-10-20'],['DATETIME dt','2026-10-20 00:00:00'],['TIMESTAMP ts','2026-10-20 00:00:00']],['timestamp-converts-datetime-unchanged'],['extra.timezones.utc'],{active:[0,1]}),
  stage('time','seoul','+09:00 조회는TIMESTAMP만09시','같은 행을 세션+09:00에서 읽었습니다. DATE와 DATETIME은 그대로이고 TIMESTAMP 조회만09:00:00으로 변했습니다.',"SET SESSION time_zone='+09:00';\nSELECT * FROM time_probe;",[['세션 offset','+09:00'],['DATE d','2026-10-20'],['DATETIME dt','2026-10-20 00:00:00'],['TIMESTAMP ts','2026-10-20 09:00:00']],['timestamp-converts-datetime-unchanged'],['extra.timezones.plus09'],{active:[0,1]}),
  stage('time','range','2040 TIMESTAMP 입력은1292','추가2040-01-01 TIMESTAMP 입력이 이 설정에서1292로 거부됐습니다. 같은 INSERT가 실패했으므로 DATE·DATETIME의2040 저장 성공을 따로 관찰한 것으로 쓰지 않습니다.',R03_RUNS.extra.timestampRange.sql,[['문제 입력','TIMESTAMP ts=2040-01-01 00:00:00'],['실측 오류','1292 · Incorrect datetime value'],['판정 범위','이 입력 거부 · 모든 날짜 경계 전수검사 아님']],['timestamp-2040-out-of-range1292'],['extra.timestampRange']),
 ]},
 {id:'keys',question:'utf8mb4 UNIQUE 키의 한도는 문자 수일까?',source:scope+' · 추가 InnoDB DYNAMIC/page16KiB 조건',sourceNote:extraNote+' runtime pageSize=16384이고 key768을 명시 ROW_FORMAT=DYNAMIC으로 만들었습니다. 다른 페이지 크기·row format의 한도를 실행한 것이 아닙니다.',note:'4바이트 최악 폭을 사용하는 키 정의 한도를 비교합니다. 실제 입력 데이터의 파일 점유나 검색 속도를 측정하지 않았습니다. '+limits,stages:[
  stage('keys','boundary','VARCHAR768 UNIQUE 생성 성공','utf8mb4에서 선언상 최대4바이트×768=3072바이트인 UNIQUE를 만들었습니다. page16KiB·DYNAMIC 조건에서 key768 생성과 row format을 확인했습니다.','CREATE TABLE key768(value VARCHAR(768) NOT NULL,UNIQUE KEY uk(value)) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;',[['페이지 크기','16384 bytes · 16KiB'],['row format','DYNAMIC'],['선언 키 최대 폭','768 × 4 = 3072 bytes'],['실측 결과','key768 CREATE 성공']],['key768-3072-on-page16384'],['runtime']),
  stage('keys','overflow','769와400+400은1071','같은 조건에서 VARCHAR769 UNIQUE와 두 VARCHAR400의 복합 UNIQUE는 각각1071로 거부됐습니다. 복합 키는 선언 폭을 합산합니다.',R03_RUNS.extra.key769.sql+';\n'+R03_RUNS.extra.keyComposite.sql+';',[['단일769 키','최악3076 bytes · 오류1071'],['복합400+400 키','최악3200 bytes · 오류1071'],['오류의 실제 한도','max key length 3072 bytes']],['unique-varchar769-error1071','unique-composite800-error1071'],['extra.key769','extra.keyComposite'],{active:[0,1]}),
 ]},
];
export const R03_ASSETS={
  "R03-schema": {
    "file": "R03-schema-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 schema 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "schema-source": [
        1,
        13,
        32,
        68
      ],
      "schema-copy": [
        34,
        13,
        32,
        68
      ],
      "schema-drop": [
        67,
        13,
        32,
        68
      ]
    }
  },
  "R03-varchar": {
    "file": "R03-varchar.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 varchar 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "varchar-ascii": [
        1,
        13,
        32,
        55
      ],
      "varchar-korean": [
        34,
        13,
        32,
        55
      ],
      "varchar-emoji": [
        67,
        13,
        32,
        55
      ],
      "varchar-overflow": [
        38,
        70,
        33,
        14
      ]
    }
  },
  "R03-nullable": {
    "file": "R03-nullable-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 nullable 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "nullable-unknown": [
        1,
        11,
        48,
        39
      ],
      "nullable-negative": [
        51,
        11,
        48,
        39
      ],
      "nullable-default": [
        1,
        52,
        48,
        42
      ],
      "nullable-required": [
        51,
        52,
        48,
        42
      ]
    }
  },
  "R03-identity": {
    "file": "R03-identity-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 identity 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "identity-nulls": [
        1,
        15,
        48,
        40
      ],
      "identity-duplicate": [
        51,
        15,
        48,
        40
      ],
      "identity-primary": [
        1,
        55,
        48,
        40
      ],
      "identity-boolean": [
        51,
        55,
        48,
        40
      ]
    }
  },
  "R03-foreign": {
    "file": "R03-foreign-v4.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 foreign 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "foreign-child": [
        1,
        10,
        32,
        58
      ],
      "foreign-parent": [
        34,
        10,
        32,
        58
      ],
      "foreign-actions": [
        1,
        10,
        98,
        85
      ]
    }
  },
  "R03-money": {
    "file": "R03-money-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 money 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "money-compare": [
        1,
        12,
        98,
        20
      ],
      "money-update": [
        34,
        35,
        32,
        57
      ],
      "money-observer": [
        49,
        59,
        17,
        28
      ],
      "money-rollback": [
        67,
        35,
        32,
        57
      ]
    }
  },
  "R03-ddl": {
    "file": "R03-ddl-v2.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 ddl 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "ddl-before": [
        1,
        19,
        32,
        61
      ],
      "ddl-create": [
        34,
        19,
        32,
        61
      ],
      "ddl-rollback": [
        67,
        19,
        32,
        61
      ]
    }
  },
  "R03-time": {
    "file": "R03-time.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 time 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "time-utc": [
        1,
        18,
        32,
        56
      ],
      "time-seoul": [
        34,
        18,
        32,
        56
      ],
      "time-range": [
        67,
        18,
        32,
        56
      ]
    }
  },
  "R03-keys": {
    "file": "R03-keys-v2.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "MySQL8.4.11의 keys 관측: 외부 학습 사본과 추가 probe를 구분한다.",
    "focus": {
      "keys-boundary": [
        1,
        24,
        48,
        62
      ],
      "keys-overflow": [
        51,
        24,
        48,
        62
      ]
    }
  }
};
