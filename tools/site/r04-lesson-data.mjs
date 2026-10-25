// R04 원문 SQL·원문 Java와 명시적 추가 관측을 구분한다.
export const r04AssetRoot = '../design/r04-2026-10-20/images/';
export const R04_RUNS = {
  "runtime": {
    "mysql": "8.4.11",
    "machine": "arm64",
    "os": "macos15",
    "sqlMode": "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
    "autocommit": 1,
    "isolation": "READ-COMMITTED",
    "charset": "utf8mb4",
    "collation": "utf8mb4_0900_ai_ci",
    "jdbcTransport": "separate fresh127.0.0.1-only port / new random SELECT-only account / sslMode REQUIRED; no existing server or original3306",
    "clientFoundRows": false
  },
  "source": {
    "initialWriter": {
      "product1": [
        {
          "id": 1,
          "name": "상품A-01",
          "stock": 33,
          "updated_at": "2026-09-01 00:00:00"
        }
      ],
      "sourceNewProducts": [],
      "coupon": [],
      "points": [],
      "memberCoupon300": [
        {
          "id": 300,
          "member_id": 100,
          "member_coupon_status": "EXPIRED"
        }
      ]
    },
    "initialObserver": {
      "product1": [
        {
          "id": 1,
          "stock": 33
        }
      ],
      "sourceNewProducts": [],
      "couponRows": 0,
      "pointRows": 0,
      "memberCoupon300": 1
    },
    "block1": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "SELECT id, order_no, total_amount\n   FROM orders\n   WHERE member_id = 1 AND order_status = 'PAID'\n   ORDER BY ordered_at DESC, id DESC\n   LIMIT 20 OFFSET 0",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "order_no": "ORD-2026-00001",
              "total_amount": "17919"
            },
            {
              "id": 901,
              "order_no": "ORD-2026-00901",
              "total_amount": "95019"
            },
            {
              "id": 721,
              "order_no": "ORD-2026-00721",
              "total_amount": "19599"
            },
            {
              "id": 541,
              "order_no": "ORD-2026-00541",
              "total_amount": "94179"
            },
            {
              "id": 361,
              "order_no": "ORD-2026-00361",
              "total_amount": "18759"
            },
            {
              "id": 181,
              "order_no": "ORD-2026-00181",
              "total_amount": "93339"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "block4": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "SHOW TABLES",
          "parameters": null,
          "rows": [
            {
              "Tables_in_ds_practice": "article"
            },
            {
              "Tables_in_ds_practice": "cart_item"
            },
            {
              "Tables_in_ds_practice": "category"
            },
            {
              "Tables_in_ds_practice": "comment"
            },
            {
              "Tables_in_ds_practice": "coupon"
            },
            {
              "Tables_in_ds_practice": "delivery"
            },
            {
              "Tables_in_ds_practice": "member"
            },
            {
              "Tables_in_ds_practice": "member_coupon"
            },
            {
              "Tables_in_ds_practice": "order_item"
            },
            {
              "Tables_in_ds_practice": "orders"
            },
            {
              "Tables_in_ds_practice": "payment"
            },
            {
              "Tables_in_ds_practice": "point_history"
            },
            {
              "Tables_in_ds_practice": "product"
            },
            {
              "Tables_in_ds_practice": "product_option"
            },
            {
              "Tables_in_ds_practice": "review"
            },
            {
              "Tables_in_ds_practice": "subscription"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "DESCRIBE orders",
          "parameters": null,
          "rows": [
            {
              "Field": "id",
              "Type": "bigint",
              "Null": "NO",
              "Key": "PRI",
              "Default": null,
              "Extra": "auto_increment"
            },
            {
              "Field": "order_no",
              "Type": "varchar(30)",
              "Null": "NO",
              "Key": "UNI",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "member_id",
              "Type": "bigint",
              "Null": "NO",
              "Key": "MUL",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "order_status",
              "Type": "varchar(20)",
              "Null": "NO",
              "Key": "MUL",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "total_amount",
              "Type": "decimal(12,0)",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "ordered_at",
              "Type": "datetime",
              "Null": "NO",
              "Key": "MUL",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "canceled_at",
              "Type": "datetime",
              "Null": "YES",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "deleted_at",
              "Type": "datetime",
              "Null": "YES",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "created_at",
              "Type": "datetime",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "updated_at",
              "Type": "datetime",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "DESCRIBE order_item",
          "parameters": null,
          "rows": [
            {
              "Field": "id",
              "Type": "bigint",
              "Null": "NO",
              "Key": "PRI",
              "Default": null,
              "Extra": "auto_increment"
            },
            {
              "Field": "order_id",
              "Type": "bigint",
              "Null": "NO",
              "Key": "MUL",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "product_id",
              "Type": "bigint",
              "Null": "NO",
              "Key": "MUL",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "product_option_id",
              "Type": "bigint",
              "Null": "YES",
              "Key": "MUL",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "quantity",
              "Type": "int",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "unit_price",
              "Type": "decimal(12,0)",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "item_status",
              "Type": "varchar(20)",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "created_at",
              "Type": "datetime",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            },
            {
              "Field": "updated_at",
              "Type": "datetime",
              "Null": "NO",
              "Key": "",
              "Default": null,
              "Extra": ""
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "block8": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "SELECT m.id member_id, o.id order_id, o.order_status\nFROM member m JOIN orders o ON o.member_id = m.id\nWHERE m.id = 1 ORDER BY o.id",
          "parameters": null,
          "rows": [
            {
              "member_id": 1,
              "order_id": 1,
              "order_status": "PAID"
            },
            {
              "member_id": 1,
              "order_id": 181,
              "order_status": "PAID"
            },
            {
              "member_id": 1,
              "order_id": 361,
              "order_status": "PAID"
            },
            {
              "member_id": 1,
              "order_id": 541,
              "order_status": "PAID"
            },
            {
              "member_id": 1,
              "order_id": 721,
              "order_status": "PAID"
            },
            {
              "member_id": 1,
              "order_id": 901,
              "order_status": "PAID"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT m.id, m.name, o.id order_id, o.order_status\nFROM member m LEFT JOIN orders o ON o.member_id = m.id\nWHERE m.id IN (181, 182) ORDER BY m.id",
          "parameters": null,
          "rows": [
            {
              "id": 181,
              "name": "회원181",
              "order_id": null,
              "order_status": null
            },
            {
              "id": 182,
              "name": "회원182",
              "order_id": null,
              "order_status": null
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT m.id member_id, o.id order_id\nFROM orders o RIGHT JOIN member m ON m.id = o.member_id\nWHERE m.id = 181",
          "parameters": null,
          "rows": [
            {
              "member_id": 181,
              "order_id": null
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT c.id category_id, m.id member_id\nFROM category c CROSS JOIN member m\nWHERE c.id IN (1, 2) AND m.id IN (181, 182)",
          "parameters": null,
          "rows": [
            {
              "category_id": 2,
              "member_id": 181
            },
            {
              "category_id": 1,
              "member_id": 181
            },
            {
              "category_id": 2,
              "member_id": 182
            },
            {
              "category_id": 1,
              "member_id": 182
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT c.id, c.name, p.id parent_id, p.name parent_name\nFROM category c LEFT JOIN category p ON p.id = c.parent_id\nWHERE c.id IN (1, 3) ORDER BY c.id",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "name": "상품",
              "parent_id": null,
              "parent_name": null
            },
            {
              "id": 3,
              "name": "세부카테고리01",
              "parent_id": 1,
              "parent_name": "상품"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "block9": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "SELECT m.id, o.id paid_order_id\nFROM member m LEFT JOIN orders o\n  ON o.member_id = m.id AND o.order_status = 'PAID'\nWHERE m.id BETWEEN 181 AND 182",
          "parameters": null,
          "rows": [
            {
              "id": 181,
              "paid_order_id": null
            },
            {
              "id": 182,
              "paid_order_id": null
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT m.id, m.name\nFROM member m\nWHERE EXISTS (SELECT 1 FROM orders o\n              WHERE o.member_id = m.id AND o.order_status = 'PAID')",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "name": "회원001"
            },
            {
              "id": 2,
              "name": "회원002"
            },
            {
              "id": 4,
              "name": "회원004"
            },
            {
              "id": 7,
              "name": "회원007"
            },
            {
              "id": 8,
              "name": "회원008"
            },
            {
              "id": 11,
              "name": "회원011"
            },
            {
              "id": 13,
              "name": "회원013"
            },
            {
              "id": 14,
              "name": "회원014"
            },
            {
              "id": 16,
              "name": "회원016"
            },
            {
              "id": 17,
              "name": "회원017"
            },
            {
              "id": 19,
              "name": "회원019"
            },
            {
              "id": 22,
              "name": "회원022"
            },
            {
              "id": 23,
              "name": "회원023"
            },
            {
              "id": 26,
              "name": "회원026"
            },
            {
              "id": 28,
              "name": "회원028"
            },
            {
              "id": 29,
              "name": "회원029"
            },
            {
              "id": 31,
              "name": "회원031"
            },
            {
              "id": 32,
              "name": "회원032"
            },
            {
              "id": 34,
              "name": "회원034"
            },
            {
              "id": 37,
              "name": "회원037"
            },
            {
              "id": 38,
              "name": "회원038"
            },
            {
              "id": 41,
              "name": "회원041"
            },
            {
              "id": 43,
              "name": "회원043"
            },
            {
              "id": 44,
              "name": "회원044"
            },
            {
              "id": 46,
              "name": "회원046"
            },
            {
              "id": 47,
              "name": "회원047"
            },
            {
              "id": 49,
              "name": "회원049"
            },
            {
              "id": 52,
              "name": "회원052"
            },
            {
              "id": 53,
              "name": "회원053"
            },
            {
              "id": 56,
              "name": "회원056"
            },
            {
              "id": 58,
              "name": "회원058"
            },
            {
              "id": 59,
              "name": "회원059"
            },
            {
              "id": 61,
              "name": "회원061"
            },
            {
              "id": 62,
              "name": "회원062"
            },
            {
              "id": 64,
              "name": "회원064"
            },
            {
              "id": 67,
              "name": "회원067"
            },
            {
              "id": 68,
              "name": "회원068"
            },
            {
              "id": 71,
              "name": "회원071"
            },
            {
              "id": 73,
              "name": "회원073"
            },
            {
              "id": 74,
              "name": "회원074"
            },
            {
              "id": 76,
              "name": "회원076"
            },
            {
              "id": 77,
              "name": "회원077"
            },
            {
              "id": 79,
              "name": "회원079"
            },
            {
              "id": 82,
              "name": "회원082"
            },
            {
              "id": 83,
              "name": "회원083"
            },
            {
              "id": 86,
              "name": "회원086"
            },
            {
              "id": 88,
              "name": "회원088"
            },
            {
              "id": 89,
              "name": "회원089"
            },
            {
              "id": 91,
              "name": "회원091"
            },
            {
              "id": 92,
              "name": "회원092"
            },
            {
              "id": 94,
              "name": "회원094"
            },
            {
              "id": 97,
              "name": "회원097"
            },
            {
              "id": 98,
              "name": "회원098"
            },
            {
              "id": 101,
              "name": "회원101"
            },
            {
              "id": 103,
              "name": "회원103"
            },
            {
              "id": 104,
              "name": "회원104"
            },
            {
              "id": 106,
              "name": "회원106"
            },
            {
              "id": 107,
              "name": "회원107"
            },
            {
              "id": 109,
              "name": "회원109"
            },
            {
              "id": 112,
              "name": "회원112"
            },
            {
              "id": 113,
              "name": "회원113"
            },
            {
              "id": 116,
              "name": "회원116"
            },
            {
              "id": 118,
              "name": "회원118"
            },
            {
              "id": 119,
              "name": "회원119"
            },
            {
              "id": 121,
              "name": "회원121"
            },
            {
              "id": 122,
              "name": "회원122"
            },
            {
              "id": 124,
              "name": "회원124"
            },
            {
              "id": 127,
              "name": "회원127"
            },
            {
              "id": 128,
              "name": "회원128"
            },
            {
              "id": 131,
              "name": "회원131"
            },
            {
              "id": 133,
              "name": "회원133"
            },
            {
              "id": 134,
              "name": "회원134"
            },
            {
              "id": 136,
              "name": "회원136"
            },
            {
              "id": 137,
              "name": "회원137"
            },
            {
              "id": 139,
              "name": "회원139"
            },
            {
              "id": 142,
              "name": "회원142"
            },
            {
              "id": 143,
              "name": "회원143"
            },
            {
              "id": 146,
              "name": "회원146"
            },
            {
              "id": 148,
              "name": "회원148"
            },
            {
              "id": 149,
              "name": "회원149"
            },
            {
              "id": 151,
              "name": "회원151"
            },
            {
              "id": 152,
              "name": "회원152"
            },
            {
              "id": 154,
              "name": "회원154"
            },
            {
              "id": 157,
              "name": "회원157"
            },
            {
              "id": 158,
              "name": "회원158"
            },
            {
              "id": 161,
              "name": "회원161"
            },
            {
              "id": 163,
              "name": "회원163"
            },
            {
              "id": 164,
              "name": "회원164"
            },
            {
              "id": 166,
              "name": "회원166"
            },
            {
              "id": 167,
              "name": "회원167"
            },
            {
              "id": 169,
              "name": "회원169"
            },
            {
              "id": 172,
              "name": "회원172"
            },
            {
              "id": 173,
              "name": "회원173"
            },
            {
              "id": 176,
              "name": "회원176"
            },
            {
              "id": 178,
              "name": "회원178"
            },
            {
              "id": 179,
              "name": "회원179"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "block10": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "SELECT o.id, o.total_amount, COUNT(oi.id) item_rows,\n       SUM(o.total_amount) wrong_total\nFROM orders o JOIN order_item oi ON oi.order_id = o.id\nWHERE o.id = 1\nGROUP BY o.id, o.total_amount",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "total_amount": "17919",
              "item_rows": 3,
              "wrong_total": "53757"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "block11": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "SELECT member_id, COUNT(*) order_count, SUM(total_amount) order_total\nFROM orders\nWHERE order_status IN ('PAID', 'SHIPPED', 'DELIVERED')\nGROUP BY member_id\nHAVING SUM(total_amount) >= 100000\nORDER BY order_total DESC, member_id\nLIMIT 20",
          "parameters": null,
          "rows": [
            {
              "member_id": 9,
              "order_count": 6,
              "order_total": "718926"
            },
            {
              "member_id": 56,
              "order_count": 6,
              "order_total": "702084"
            },
            {
              "member_id": 18,
              "order_count": 6,
              "order_total": "696552"
            },
            {
              "member_id": 65,
              "order_count": 6,
              "order_total": "679710"
            },
            {
              "member_id": 93,
              "order_count": 6,
              "order_total": "660102"
            },
            {
              "member_id": 55,
              "order_count": 6,
              "order_total": "654570"
            },
            {
              "member_id": 36,
              "order_count": 6,
              "order_total": "651804"
            },
            {
              "member_id": 47,
              "order_count": 5,
              "order_total": "641425"
            },
            {
              "member_id": 170,
              "order_count": 5,
              "order_total": "635350"
            },
            {
              "member_id": 83,
              "order_count": 6,
              "order_total": "634962"
            },
            {
              "member_id": 151,
              "order_count": 5,
              "order_total": "633045"
            },
            {
              "member_id": 64,
              "order_count": 6,
              "order_total": "632196"
            },
            {
              "member_id": 132,
              "order_count": 5,
              "order_total": "630740"
            },
            {
              "member_id": 45,
              "order_count": 6,
              "order_total": "629430"
            },
            {
              "member_id": 113,
              "order_count": 5,
              "order_total": "628435"
            },
            {
              "member_id": 26,
              "order_count": 6,
              "order_total": "626664"
            },
            {
              "member_id": 7,
              "order_count": 6,
              "order_total": "623898"
            },
            {
              "member_id": 84,
              "order_count": 5,
              "order_total": "606440"
            },
            {
              "member_id": 8,
              "order_count": 5,
              "order_total": "597220"
            },
            {
              "member_id": 112,
              "order_count": 5,
              "order_total": "588840"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "block13": {
      "adapter": "remove line comments for splitting only; original SQL expressions/indentation in source file unchanged",
      "events": [
        {
          "sql": "START TRANSACTION",
          "parameters": null,
          "rows": null,
          "affectedRows": 0,
          "connection": "writer"
        },
        {
          "sql": "INSERT INTO product (category_id, name, product_type, price, stock, sale_status, created_at, updated_at)\nVALUES\n (3, 'R04 상품 A', 'GOODS', 1000, 3, 'ON_SALE', '2026-09-28', '2026-09-28'),\n (3, 'R04 상품 B', 'EBOOK', 2000, 5, 'ON_SALE', '2026-09-28', '2026-09-28')",
          "parameters": null,
          "rows": null,
          "affectedRows": 2,
          "connection": "writer"
        },
        {
          "additionalIndependentObserverAfterStatement": {
            "product1": [
              {
                "id": 1,
                "stock": 33
              }
            ],
            "sourceNewProducts": [],
            "couponRows": 0,
            "pointRows": 0,
            "memberCoupon300": 1
          }
        },
        {
          "additionalWriterAfterStatement": {
            "product1": [
              {
                "id": 1,
                "name": "상품A-01",
                "stock": 33,
                "updated_at": "2026-09-01 00:00:00"
              }
            ],
            "sourceNewProducts": [
              {
                "id": 81,
                "name": "R04 상품 A",
                "price": "1000",
                "stock": 3
              },
              {
                "id": 82,
                "name": "R04 상품 B",
                "price": "2000",
                "stock": 5
              }
            ],
            "coupon": [],
            "points": [],
            "memberCoupon300": [
              {
                "id": 300,
                "member_id": 100,
                "member_coupon_status": "EXPIRED"
              }
            ]
          }
        },
        {
          "sql": "INSERT INTO coupon (code, name, discount_amount, min_order_amount, valid_from, valid_to, created_at, updated_at)\nVALUES ('R04-DEMO', 'R04 쿠폰', 1000, 0, '2026-01-01', '2027-01-01', '2026-09-28', '2026-09-28') AS incoming\nON DUPLICATE KEY UPDATE discount_amount = incoming.discount_amount,\n                        updated_at = incoming.updated_at",
          "parameters": null,
          "rows": null,
          "affectedRows": 1,
          "connection": "writer"
        },
        {
          "additionalIndependentObserverAfterStatement": {
            "product1": [
              {
                "id": 1,
                "stock": 33
              }
            ],
            "sourceNewProducts": [],
            "couponRows": 0,
            "pointRows": 0,
            "memberCoupon300": 1
          }
        },
        {
          "additionalWriterAfterStatement": {
            "product1": [
              {
                "id": 1,
                "name": "상품A-01",
                "stock": 33,
                "updated_at": "2026-09-01 00:00:00"
              }
            ],
            "sourceNewProducts": [
              {
                "id": 81,
                "name": "R04 상품 A",
                "price": "1000",
                "stock": 3
              },
              {
                "id": 82,
                "name": "R04 상품 B",
                "price": "2000",
                "stock": 5
              }
            ],
            "coupon": [
              {
                "id": 11,
                "code": "R04-DEMO",
                "discount_amount": "1000"
              }
            ],
            "points": [],
            "memberCoupon300": [
              {
                "id": 300,
                "member_id": 100,
                "member_coupon_status": "EXPIRED"
              }
            ]
          }
        },
        {
          "sql": "INSERT INTO point_history (member_id, order_id, point_type, amount, balance_after, memo, created_at, updated_at)\nSELECT o.member_id, o.id, 'EARN', 100, 100, 'R04 실습', '2026-09-28', '2026-09-28'\nFROM orders o WHERE o.id = 1",
          "parameters": null,
          "rows": null,
          "affectedRows": 1,
          "connection": "writer"
        },
        {
          "additionalIndependentObserverAfterStatement": {
            "product1": [
              {
                "id": 1,
                "stock": 33
              }
            ],
            "sourceNewProducts": [],
            "couponRows": 0,
            "pointRows": 0,
            "memberCoupon300": 1
          }
        },
        {
          "additionalWriterAfterStatement": {
            "product1": [
              {
                "id": 1,
                "name": "상품A-01",
                "stock": 33,
                "updated_at": "2026-09-01 00:00:00"
              }
            ],
            "sourceNewProducts": [
              {
                "id": 81,
                "name": "R04 상품 A",
                "price": "1000",
                "stock": 3
              },
              {
                "id": 82,
                "name": "R04 상품 B",
                "price": "2000",
                "stock": 5
              }
            ],
            "coupon": [
              {
                "id": 11,
                "code": "R04-DEMO",
                "discount_amount": "1000"
              }
            ],
            "points": [
              {
                "id": 1501,
                "member_id": 1,
                "order_id": 1,
                "amount": 100,
                "memo": "R04 실습"
              }
            ],
            "memberCoupon300": [
              {
                "id": 300,
                "member_id": 100,
                "member_coupon_status": "EXPIRED"
              }
            ]
          }
        },
        {
          "sql": "SELECT id, name, stock FROM product WHERE id = 1",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "name": "상품A-01",
              "stock": 33
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "UPDATE product SET stock = stock - 1, updated_at = '2026-09-28'\nWHERE id = 1 AND stock > 0",
          "parameters": null,
          "rows": null,
          "affectedRows": 1,
          "connection": "writer"
        },
        {
          "additionalIndependentObserverAfterStatement": {
            "product1": [
              {
                "id": 1,
                "stock": 33
              }
            ],
            "sourceNewProducts": [],
            "couponRows": 0,
            "pointRows": 0,
            "memberCoupon300": 1
          }
        },
        {
          "sql": "SELECT ROW_COUNT() changed_rows",
          "parameters": null,
          "rows": [
            {
              "changed_rows": 1
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "additionalWriterAfterStatement": {
            "product1": [
              {
                "id": 1,
                "name": "상품A-01",
                "stock": 32,
                "updated_at": "2026-09-28 00:00:00"
              }
            ],
            "sourceNewProducts": [
              {
                "id": 81,
                "name": "R04 상품 A",
                "price": "1000",
                "stock": 3
              },
              {
                "id": 82,
                "name": "R04 상품 B",
                "price": "2000",
                "stock": 5
              }
            ],
            "coupon": [
              {
                "id": 11,
                "code": "R04-DEMO",
                "discount_amount": "1000"
              }
            ],
            "points": [
              {
                "id": 1501,
                "member_id": 1,
                "order_id": 1,
                "amount": 100,
                "memo": "R04 실습"
              }
            ],
            "memberCoupon300": [
              {
                "id": 300,
                "member_id": 100,
                "member_coupon_status": "EXPIRED"
              }
            ]
          }
        },
        {
          "sql": "SELECT id, member_id, member_coupon_status FROM member_coupon WHERE id = 300",
          "parameters": null,
          "rows": [
            {
              "id": 300,
              "member_id": 100,
              "member_coupon_status": "EXPIRED"
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "DELETE FROM member_coupon WHERE id = 300",
          "parameters": null,
          "rows": null,
          "affectedRows": 1,
          "connection": "writer"
        },
        {
          "additionalIndependentObserverAfterStatement": {
            "product1": [
              {
                "id": 1,
                "stock": 33
              }
            ],
            "sourceNewProducts": [],
            "couponRows": 0,
            "pointRows": 0,
            "memberCoupon300": 1
          }
        },
        {
          "sql": "SELECT ROW_COUNT() deleted_rows",
          "parameters": null,
          "rows": [
            {
              "deleted_rows": 1
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "additionalWriterAfterStatement": {
            "product1": [
              {
                "id": 1,
                "name": "상품A-01",
                "stock": 32,
                "updated_at": "2026-09-28 00:00:00"
              }
            ],
            "sourceNewProducts": [
              {
                "id": 81,
                "name": "R04 상품 A",
                "price": "1000",
                "stock": 3
              },
              {
                "id": 82,
                "name": "R04 상품 B",
                "price": "2000",
                "stock": 5
              }
            ],
            "coupon": [
              {
                "id": 11,
                "code": "R04-DEMO",
                "discount_amount": "1000"
              }
            ],
            "points": [
              {
                "id": 1501,
                "member_id": 1,
                "order_id": 1,
                "amount": 100,
                "memo": "R04 실습"
              }
            ],
            "memberCoupon300": []
          }
        },
        {
          "sql": "ROLLBACK",
          "parameters": null,
          "rows": null,
          "affectedRows": 0,
          "connection": "writer"
        },
        {
          "sql": "SELECT id, stock FROM product WHERE id = 1",
          "parameters": null,
          "rows": [
            {
              "id": 1,
              "stock": 33
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT COUNT(*) coupon_rows FROM coupon WHERE code = 'R04-DEMO'",
          "parameters": null,
          "rows": [
            {
              "coupon_rows": 0
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT COUNT(*) point_rows FROM point_history WHERE memo = 'R04 실습'",
          "parameters": null,
          "rows": [
            {
              "point_rows": 0
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        },
        {
          "sql": "SELECT COUNT(*) member_coupon_rows FROM member_coupon WHERE id = 300",
          "parameters": null,
          "rows": [
            {
              "member_coupon_rows": 1
            }
          ],
          "affectedRows": null,
          "connection": "writer"
        }
      ]
    },
    "afterRollback": {
      "product1": [
        {
          "id": 1,
          "stock": 33
        }
      ],
      "sourceNewProducts": [],
      "couponRows": 0,
      "pointRows": 0,
      "memberCoupon300": 1
    },
    "afterRollbackWriter": {
      "product1": [
        {
          "id": 1,
          "name": "상품A-01",
          "stock": 33,
          "updated_at": "2026-09-01 00:00:00"
        }
      ],
      "sourceNewProducts": [],
      "coupon": [],
      "points": [],
      "memberCoupon300": [
        {
          "id": 300,
          "member_id": 100,
          "member_coupon_status": "EXPIRED"
        }
      ]
    }
  },
  "extra": {
    "leftWhere": [],
    "countNull": [
      {
        "id": 181,
        "expanded_rows": 1,
        "actual_orders": 0
      },
      {
        "id": 182,
        "expanded_rows": 1,
        "actual_orders": 0
      }
    ],
    "nullComparisons": [
      {
        "equals_null": null,
        "is_null": 1,
        "not_in": null,
        "not_exists": 1
      }
    ],
    "equalAmounts": [
      {
        "join_rows": 3,
        "wrong_total": "300",
        "wrong_distinct": "100",
        "correct_total": "200"
      }
    ],
    "aliasWhere": {
      "sql": "SELECT total_amount AS amount FROM ds_practice.orders WHERE amount>0",
      "parameters": null,
      "error": {
        "code": 1054,
        "message": "Unknown column 'amount' in 'where clause'"
      },
      "connection": "writer"
    },
    "ambiguous": {
      "sql": "SELECT id FROM ds_practice.member m JOIN ds_practice.orders o ON o.member_id=m.id",
      "parameters": null,
      "error": {
        "code": 1052,
        "message": "Column 'id' in field list is ambiguous"
      },
      "connection": "writer"
    },
    "aggregateWhere": {
      "sql": "SELECT member_id,COUNT(*) FROM ds_practice.orders WHERE COUNT(*)>1 GROUP BY member_id",
      "parameters": null,
      "error": {
        "code": 1111,
        "message": "Invalid use of group function"
      },
      "connection": "writer"
    },
    "notGrouped": {
      "sql": "SELECT member_id,order_no,COUNT(*) FROM ds_practice.orders GROUP BY member_id",
      "parameters": null,
      "error": {
        "code": 1055,
        "message": "Expression #2 of SELECT list is not in GROUP BY clause and contains nonaggregated column 'ds_practice.orders.order_no' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by"
      },
      "connection": "writer"
    },
    "functionalDependency": [
      {
        "id": 1,
        "order_no": "ORD-2026-00001",
        "n": 1
      }
    ],
    "identifierMarker": {
      "sql": "PREPARE bad_identifier FROM 'SELECT * FROM ?'",
      "parameters": null,
      "error": {
        "code": 1064,
        "message": "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '?' at line 1"
      },
      "connection": "writer"
    },
    "upsert": {
      "new": {
        "sql": "INSERT INTO upsert_probe VALUES(1,'a@example.invalid',10)AS incoming ON DUPLICATE KEY UPDATE amount=incoming.amount",
        "parameters": null,
        "rows": null,
        "affectedRows": 1,
        "connection": "writer"
      },
      "uniqueConflictChanged": {
        "sql": "INSERT INTO upsert_probe VALUES(2,'a@example.invalid',20)AS incoming ON DUPLICATE KEY UPDATE amount=incoming.amount",
        "parameters": null,
        "rows": null,
        "affectedRows": 2,
        "connection": "writer"
      },
      "unchanged": {
        "sql": "INSERT INTO upsert_probe VALUES(2,'a@example.invalid',20)AS incoming ON DUPLICATE KEY UPDATE amount=incoming.amount",
        "parameters": null,
        "rows": null,
        "affectedRows": 0,
        "connection": "writer"
      },
      "rows": [
        {
          "id": 1,
          "email": "a@example.invalid",
          "amount": 20
        }
      ]
    },
    "autocommitAfterRollback": [
      {
        "id": 1
      }
    ],
    "explicitCommit": {
      "observerBeforeCommit": [
        {
          "id": 1
        }
      ],
      "observerAfterCommitThenRollback": [
        {
          "id": 1
        },
        {
          "id": 2
        }
      ]
    },
    "statementError": {
      "failed": {
        "sql": "INSERT INTO statement_probe VALUES(2,-1)",
        "parameters": null,
        "error": {
          "code": 3819,
          "message": "Check constraint 'statement_probe_chk_1' is violated."
        },
        "connection": "writer"
      },
      "writerBeforeExplicitRollback": [
        {
          "id": 1,
          "amount": 10
        }
      ],
      "observerBeforeExplicitRollback": [],
      "afterRollback": []
    },
    "safeUpdate": {
      "sql": "UPDATE safe_probe SET value=99",
      "parameters": null,
      "error": {
        "code": 1175,
        "message": "You are using safe update mode and you tried to update a table without a WHERE that uses a KEY column. "
      },
      "connection": "writer"
    },
    "controlledInterleaving": {
      "firstPlainSelect": [
        {
          "id": 1,
          "stock": 1
        }
      ],
      "otherConnectionAutocommitUpdate": {
        "sql": "UPDATE r04_extra.race_probe SET stock=0 WHERE id=1",
        "parameters": null,
        "rows": null,
        "affectedRows": 1,
        "connection": "observer"
      },
      "guardedUpdate": {
        "sql": "UPDATE race_probe SET stock=stock-1 WHERE id=1 AND stock>0",
        "parameters": null,
        "rows": null,
        "affectedRows": 0,
        "connection": "writer"
      },
      "final": [
        {
          "id": 1,
          "stock": 0
        }
      ]
    }
  },
  "jdbc": {
    "versions": {
      "spring": "7.0.9",
      "java": 21,
      "driver": "mysql-connector-j-9.7.0 (Revision: 0aade1f13bcc98faf7dda5c02e782481eb291f62)",
      "mysql": "8.4.11"
    },
    "scope": "original OrderReadRepository unchanged; added JDK21 standalone JdbcTemplate/DataSource/observer; Boot4.1.1 BOM only; Java25/Boot app/YAML/HTTP not executed",
    "member1": [
      {
        "id": 1,
        "orderNo": "ORD-2026-00001",
        "totalAmount": "17919"
      },
      {
        "id": 901,
        "orderNo": "ORD-2026-00901",
        "totalAmount": "95019"
      },
      {
        "id": 721,
        "orderNo": "ORD-2026-00721",
        "totalAmount": "19599"
      },
      {
        "id": 541,
        "orderNo": "ORD-2026-00541",
        "totalAmount": "94179"
      },
      {
        "id": 361,
        "orderNo": "ORD-2026-00361",
        "totalAmount": "18759"
      },
      {
        "id": 181,
        "orderNo": "ORD-2026-00181",
        "totalAmount": "93339"
      }
    ],
    "member181": [],
    "queries": [
      {
        "sql": "SELECT o.id AS order_id, o.order_no, o.total_amount\nFROM member m JOIN orders o ON o.member_id = m.id\nWHERE m.id = ?\nORDER BY o.ordered_at DESC, o.id DESC\n",
        "bindings": {
          "1": {
            "method": "setLong",
            "value": 1
          }
        },
        "statementClass": "com.mysql.cj.jdbc.ServerPreparedStatement",
        "statementClosed": true,
        "resultClosed": true
      },
      {
        "sql": "SELECT o.id AS order_id, o.order_no, o.total_amount\nFROM member m JOIN orders o ON o.member_id = m.id\nWHERE m.id = ?\nORDER BY o.ordered_at DESC, o.id DESC\n",
        "bindings": {
          "1": {
            "method": "setLong",
            "value": 181
          }
        },
        "statementClass": "com.mysql.cj.jdbc.ServerPreparedStatement",
        "statementClosed": true,
        "resultClosed": true
      }
    ],
    "trackedSourceConnections": {
      "opened": 2,
      "closed": 2,
      "excludes": "setup/native guard/metadata queries"
    },
    "checks": [
      "jdbc-connects-only-guarded-new-datadir",
      "jdbc-native-mysql8.4.11-loopback",
      "original-jdbc-member1-six-ordered-summaries",
      "original-jdbc-member181-empty",
      "original-rowmapper-bigdecimal",
      "original-setLong-index1-values1-and181",
      "jdbc-two-source-connections-closed",
      "jdbc-statements-and-resultsets-closed"
    ]
  },
  "checks": [
    "private-native-mysql8.4.11",
    "initial-source-stock33-and-no-demo-rows",
    "source-show16tables",
    "source-sorted-limit-member1-six",
    "source-inner-member1-six",
    "source-left181182-null",
    "source-right181-null",
    "source-cross2x2-four",
    "source-self-category3-parent1",
    "source-left-paid-on-preserves181182",
    "source-exists-unique96-members",
    "source-join-sum17919-times3-is53757",
    "source-group-having-limit20",
    "source-insert-writer-sees-two-products-coupon-point",
    "source-stock32-and-deleted-membercoupon-only-writer",
    "source-update-delete-each1",
    "source-uncommitted-mutations-invisible",
    "source-rollback-restores-stock-and-coupon-point-membercoupon",
    "source-final-original-selects",
    "extra-left-right-condition-in-where-drops-unmatched",
    "extra-left-count-star1-count-id0",
    "extra-null-unknown-notin-vs-notexists",
    "extra-sum-distinct-loses-equal-separate-orders",
    "extra-select-alias-where1054",
    "extra-unqualified-id1052",
    "extra-aggregate-in-where1111",
    "extra-nondetermined-order-no1055",
    "extra-pk-functional-dependency-allowed",
    "extra-table-name-parameter1064",
    "extra-upsert-any-unique-not-only-pk",
    "extra-upsert-affected1-2-0-default-client-flags",
    "extra-autocommit-insert-survives-later-rollback",
    "extra-explicit-commit-survives-later-rollback",
    "extra-check-statement3819",
    "extra-statement-error-does-not-auto-rollback-earlier-insert",
    "extra-safe-update-no-key1175",
    "extra-safe-update-rows-unchanged",
    "extra-precheck-select-does-not-lock-out-other-writer",
    "jdbc-eight-checks-passed",
    "jdbc-original-result-agrees-native-sql",
    "jdbc-server-prepared-statement-observed"
  ]
};
export const r04Run=path=>path.split('.').reduce((object,key)=>object?.[key],R04_RUNS);
const sql=path=>r04Run(path).sql+';';
const stage=(topic,id,title,lead,code,values,checks=[],runKeys=[],extra={})=>({id:topic+'-'+id,title,lead,code,values,checks,runKeys,active:[0],image:'R04-'+topic,...extra});
const scope='격리 native MySQL 8.4.11 / 원문 SQL·JDK 21 JDBC 추가 실행';
const limits='원문 Java 25·Boot 앱·YAML·bash 3306 접속·HTTP는 미실행입니다. wire·물리 실행계획·속도·부하시험은 측정하지 않았습니다.';
const sourceNote='외부 연습 schema/seed 사본을 새 datadir의 MySQL에 적재했습니다. 원문 SQL7블록 표현식과 Java OrderReadRepository는 유지했고 추가 snapshot·r04_extra를 구분합니다.';
const sqlNotes='원문 SQL 파일의 표현식은 그대로이며 줄 주석만 분할용으로 제거했습니다. 기존 학습자 DB를 실행한 결과가 아닙니다. '+limits;
export const R04_FULL_DML_TRANSACTION = String.raw`START TRANSACTION;

INSERT INTO product (category_id, name, product_type, price, stock, sale_status, created_at, updated_at)
VALUES
 (3, 'R04 상품 A', 'GOODS', 1000, 3, 'ON_SALE', '2026-09-28', '2026-09-28'),
 (3, 'R04 상품 B', 'EBOOK', 2000, 5, 'ON_SALE', '2026-09-28', '2026-09-28');

INSERT INTO coupon (code, name, discount_amount, min_order_amount, valid_from, valid_to, created_at, updated_at)
VALUES ('R04-DEMO', 'R04 쿠폰', 1000, 0, '2026-01-01', '2027-01-01', '2026-09-28', '2026-09-28') AS incoming
ON DUPLICATE KEY UPDATE discount_amount = incoming.discount_amount,
                        updated_at = incoming.updated_at;

INSERT INTO point_history (member_id, order_id, point_type, amount, balance_after, memo, created_at, updated_at)
SELECT o.member_id, o.id, 'EARN', 100, 100, 'R04 실습', '2026-09-28', '2026-09-28'
FROM orders o WHERE o.id = 1;

-- product 1의 초기 재고 33 확인 후 차감
SELECT id, name, stock FROM product WHERE id = 1;
UPDATE product SET stock = stock - 1, updated_at = '2026-09-28'
WHERE id = 1 AND stock > 0;
SELECT ROW_COUNT() changed_rows;

-- 삭제 대상 미리 확인 후 같은 PK로 삭제
SELECT id, member_id, member_coupon_status FROM member_coupon WHERE id = 300;
DELETE FROM member_coupon WHERE id = 300;
SELECT ROW_COUNT() deleted_rows;

ROLLBACK;

SELECT id, stock FROM product WHERE id = 1;
SELECT COUNT(*) coupon_rows FROM coupon WHERE code = 'R04-DEMO';
SELECT COUNT(*) point_rows FROM point_history WHERE memo = 'R04 실습';
SELECT COUNT(*) member_coupon_rows FROM member_coupon WHERE id = 300;
`;
export const R04_LESSONS=[
{id:'select',question:'SELECT의 결과와 논리 처리 설명은 같은 관측일까?',source:scope+' · 원문 block01/04',sourceNote,note:sqlNotes,stages:[
 stage('select','result','필터·정렬 뒤 회원1의6행','원문 SELECT는 회원1·PAID 주문을 ordered_at DESC,id DESC로 정렬합니다. 실제 결과 id는1,901,721,541,361,181이며 LIMIT20보다 적은6행이었습니다.',sql('source.block1.events.0'),[['원문 결과 행 수','6'],['정렬된 주문 IDs','[1,901,721,541,361,181]'],['원문 ORDER BY','ordered_at DESC, id DESC'],['준비 관측','새 MySQL8.4.11 · 테이블16개 · product1 stock33']],['private-native-mysql8.4.11','source-show16tables','initial-source-stock33-and-no-demo-rows','source-sorted-limit-member1-six'],['runtime','source.block1.events.0','source.block4.events.0','source.initialObserver']),
 stage('select','logical','논리 순서는 설명 모델','같은 쿼리를 FROM/JOIN→WHERE→GROUP BY→HAVING→SELECT→ORDER BY→LIMIT의 개념 순서로 읽습니다. 실제 옵티마이저 접근 순서나 물리 실행계획을 측정한 그림이 아닙니다.',sql('source.block1.events.0'),[['설명 모델','FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT'],['이 쿼리에서 생략된 절','GROUP BY / HAVING 없음'],['실측 범위','결과6행 · 물리 처리 순서 미계측']],[],['source.block1.events.0']),
]},
{id:'jdbc',question:'원문 JDBC의 ?와 RowMapper는 무엇을 주고받았을까?',source:'원문 block07 그대로 · Spring7.0.9 / Connector/J9.7.0 / JDK21 · Boot4.1.1 BOM만',sourceNote:'추가 SELECT-only 계정을 새 loopback-only 포트·TLS sslMode REQUIRED로 연결했습니다. 원문 YAML의 localhost3306이나 Boot 앱을 사용하지 않았습니다. JDBC 원문에는 order_status 조건이 없고 SQL block01에는 PAID 조건이 있습니다. 이 seed의 회원1 주문6개가 모두 PAID여서 이번 결과만 일치했습니다.',note:'원문 메서드2호출의 연결·statement·resultset만 추적했습니다. setup/native guard/metadata 연결은 제외하며 pool 크기나 전체 DB 연결 수가 아닙니다. '+limits,stages:[
 stage('jdbc','bind','setLong은1번 값 자리','원문 connection.prepareStatement(SQL) 뒤 ps.setLong(1,memberId)가 실행됐습니다. 실제 statement 클래스는 ServerPreparedStatement였고 두 호출의1번 값은1과181이었습니다.','PreparedStatement ps = connection.prepareStatement(SQL);\nps.setLong(1, memberId);\nreturn ps;',[['바인딩 index','1 · 1부터 시작'],['두 입력의 setLong 값','1 / 181'],['실제 statement 클래스','com.mysql.cj.jdbc.ServerPreparedStatement'],['접속 범위','새 datadir·loopback TLS·SELECT-only 계정']],['jdbc-connects-only-guarded-new-datadir','jdbc-native-mysql8.4.11-loopback','original-setLong-index1-values1-and181','jdbc-server-prepared-statement-observed','jdbc-eight-checks-passed'],['jdbc.queries','jdbc.versions','runtime.jdbcTransport'],{active:[0,1]}),
 stage('jdbc','map','열 라벨에서 record6개로','원문 RowMapper가 order_id를 long,order_no를 String,total_amount를 BigDecimal로 읽었습니다. 회원1의 반환 record6개와 순서는 native 원문 SELECT 결과와 같았습니다.','new OrderSummary(rs.getLong("order_id"), rs.getString("order_no"),\n        rs.getBigDecimal("total_amount"));',[['반환 record 수','6'],['정렬된 id','[1,901,721,541,361,181]'],['첫 record','id=1 / ORD-2026-00001 / totalAmount=17919'],['금액 Java 타입','BigDecimal']],['original-jdbc-member1-six-ordered-summaries','original-rowmapper-bigdecimal','jdbc-original-result-agrees-native-sql'],['jdbc.member1','source.block1.events.0'],{active:[0,1]}),
 stage('jdbc','empty','회원181은 빈 목록','원문 findByMemberId(181L)는 빈 목록입니다. 주문 id181이 회원1 결과에 있다는 사실과 회원 id181을 구분합니다. 두 원문 호출의 연결2개·statement/resultset은 모두 닫혔습니다.','source.findByMemberId(181L);',[['member181 반환','[]'],['추적한 원문 연결','opened=2 / closed=2 · setup guard 제외'],['statement / resultset','두 호출 모두 closed=true'],['ID 구분','memberId181 ≠ orderId181']],['original-jdbc-member181-empty','jdbc-two-source-connections-closed','jdbc-statements-and-resultsets-closed'],['jdbc.member181','jdbc.trackedSourceConnections','jdbc.queries']),
 stage('jdbc','identifier','?로 테이블명은 지정하지 못함','추가 서버 PREPARE에서 SELECT * FROM ?는1064로 거부됐습니다. 원문 setLong은 값 자리이며 테이블명·정렬 구문을 바인딩한 것이 아닙니다.',sql('extra.identifierMarker'),[['추가 입력','PREPARE ... SELECT * FROM ?'],['실측 오류','1064 · 식별자 자리 marker 거부'],['원문과 구분','추가 PREPARE probe · 원문 Repository 실행 오류 아님']],['extra-table-name-parameter1064'],['extra.identifierMarker']),
]},
{id:'joins',question:'INNER·LEFT·RIGHT는 어느 회원을 남겼을까?',source:scope+' · 원문 block08 첫3 SELECT',sourceNote,note:sqlNotes,stages:[
 stage('joins','inner','회원1과 매칭 주문6행','원문 INNER JOIN은 회원1에 매칭되는 주문6개만 반환했습니다. 이 쿼리는 ORDER BY o.id라 앞의 날짜 정렬 결과와 순서가 다릅니다.',sql('source.block8.events.0'),[['member_id','1'],['order_id 순서','[1,181,361,541,721,901]'],['실측 행 수','6']],['source-inner-member1-six'],['source.block8.events.0']),
 stage('joins','left','LEFT는181·182도 보존','왼쪽 회원181·182가 주문 없이 남았습니다. 실제 행의 order_id와 order_status는NULL이며 회원이 삭제되거나 주문0번을 만든 뜻이 아닙니다.',sql('source.block8.events.1'),[['남은 회원','181 / 182'],['각 order_id / order_status','NULL / NULL'],['ORDER BY','m.id · 결과2행']],['source-left181182-null'],['source.block8.events.1']),
 stage('joins','right','RIGHT는 오른쪽 회원181 보존','원문 orders RIGHT JOIN member는 오른쪽 회원181을 보존합니다. 결과는 member_id181·order_idNULL 한 행이었습니다.',sql('source.block8.events.2'),[['보존한 쪽','오른쪽 member'],['실측 결과','member_id=181 / order_id=NULL'],['실측 행 수','1']],['source-right181-null'],['source.block8.events.2']),
]},
{id:'crossself',question:'모든 조합과 같은 테이블 연결은 어떻게 다를까?',source:scope+' · 원문 block08 CROSS/SELF',sourceNote,note:'CROSS 쿼리에는 ORDER BY가 없어 실측 배열 순서를 보장하지 않습니다. SELF 쿼리는 c.id로 정렬합니다. '+sqlNotes,stages:[
 stage('crossself','cross','2카테고리 × 2회원은 4조합','원문 CROSS JOIN은 카테고리1·2와 회원181·182의 조합4개입니다. 아래는 조합 집합이며 반환 순서를 규칙으로 삼지 않습니다.',sql('source.block8.events.3'),[['입력 집합','category {1,2} / member {181,182}'],['결과 조합 집합','{(1,181),(1,182),(2,181),(2,182)}'],['실측 행 수','4 · 순서 보장 없음']],['source-cross2x2-four'],['source.block8.events.3']),
 stage('crossself','self','category3의 부모는1·상품','같은 category를 c와p로 연결했습니다. category1은 parent NULL이고 category3의 parent_id1·parent_name상품을 읽었습니다.',sql('source.block8.events.4'),[['category1','상품 / parent_id=NULL'],['category3','세부카테고리01 / parent_id=1'],['category3 parent_name','상품'],['실측 정렬','c.id · 두 행']],['source-self-category3-parent1'],['source.block8.events.4']),
]},
{id:'outer',question:'오른쪽 조건을 ON과 WHERE 중 어디에 두면 남을까?',source:scope+' · 원문 block09 ON / 추가 WHERE·COUNT',sourceNote:'ON 쿼리는 원문이고 WHERE 이동·COUNT 비교는 추가 probe입니다. 같은 미매칭 회원181·182를 비교합니다.',note:'원문 ON에는 ORDER BY가 없어 행의 표시 순서 자체는 계약이 아닙니다. COUNT(column)은NULL을 세지 않습니다. '+limits,stages:[
 stage('outer','on','PAID 조건이 ON이면 미매칭 보존','원문은 주문 상태 조건을 ON에 둡니다. 주문이 없는 회원181·182도 paid_order_idNULL인 두 행으로 남았습니다.',sql('source.block9.events.0'),[['조건 위치','ON ... o.order_status=PAID'],['보존한 회원 집합','{181,182}'],['paid_order_id','두 행 모두NULL']],['source-left-paid-on-preserves181182'],['source.block9.events.0']),
 stage('outer','where','추가 WHERE 조건은 NULL 행 탈락','추가 probe는 같은 오른쪽 PAID 조건을 WHERE로 옮겼습니다. 미매칭NULL 행이 탈락해 결과는 빈 배열입니다.',"SELECT m.id,o.id AS paid_order_id FROM ds_practice.member m\nLEFT JOIN ds_practice.orders o ON o.member_id=m.id\nWHERE m.id BETWEEN 181 AND 182 AND o.order_status='PAID';",[['추가 조건 위치','WHERE ... o.order_status=PAID'],['실측 결과','[]'],['원문 ON과 차이','미매칭 회원 행 탈락']],['extra-left-right-condition-in-where-drops-unmatched'],['extra.leftWhere']),
 stage('outer','count','COUNT(*)는1·COUNT(id)는0','추가 outer 결과에서 각 회원은 한 확장 행을 가지므로 COUNT(*)=1입니다. 오른쪽 o.id는NULL이어서 COUNT(o.id)=0입니다.','SELECT m.id,COUNT(*)AS expanded_rows,COUNT(o.id)AS actual_orders\nFROM ds_practice.member m LEFT JOIN ds_practice.orders o ON o.member_id=m.id\nWHERE m.id IN(181,182) GROUP BY m.id ORDER BY m.id;',[['회원181','expanded_rows=1 / actual_orders=0'],['회원182','expanded_rows=1 / actual_orders=0'],['집계 단위','JOIN 확장 행 / NULL 아닌 주문id']],['extra-left-count-star1-count-id0'],['extra.countNull']),
]},
{id:'aggregate',question:'JOIN 뒤 SUM은 왜 주문 합계를 부풀릴까?',source:scope+' · 원문 block10/11 + 추가 동금액 주문',sourceNote:'원문 주문1/항목3행과 추가 header_probe 두 주문은 별개입니다. 동금액 DISTINCT 비교를 원문 주문 가격으로 바꾸지 않습니다.',note:sqlNotes,stages:[
 stage('aggregate','fanout','17919가 항목3행에 반복','원문 주문1 금액17919가 항목3행에 반복되어 SUM(o.total_amount)는53757이었습니다. 주문이3개라는 뜻은 아닙니다.',sql('source.block10.events.0'),[['원문 주문1 total_amount','17919'],['item_rows','3'],['wrong_total','53757 = 17919 × 3']],['source-join-sum17919-times3-is53757'],['source.block10.events.0']),
 stage('aggregate','distinct','같은 금액의 다른 주문은 DISTINCT로 빠짐','추가 header_probe에는 금액100인 서로 다른 주문1·2가 있습니다. JOIN3행 합계300을 DISTINCT100으로 고쳐도 올바른 헤더 합계200과 다릅니다.','SELECT COUNT(*)AS join_rows,SUM(h.total)AS wrong_total,\nSUM(DISTINCT h.total)AS wrong_distinct,\n(SELECT SUM(total)FROM header_probe)AS correct_total\nFROM header_probe h JOIN item_probe i ON i.order_id=h.id;',[['추가 주문 헤더','id1 total100 / id2 total100'],['JOIN 행 수','3'],['wrong_total / wrong_distinct','300 / 100'],['correct_total','200']],['extra-sum-distinct-loses-equal-separate-orders'],['extra.equalAmounts']),
 stage('aggregate','groups','WHERE → GROUP → HAVING 결과20행','원문은 대상 상태를 WHERE로 거르고 회원별 합계를 HAVING으로 제한합니다. order_total DESC,member_id 정렬 결과20행이며 첫3개는 회원9·56·18입니다.',sql('source.block11.events.0'),[['반환 그룹 수','20'],['첫3 member / total','9 / 718926 · 56 / 702084 · 18 / 696552'],['HAVING 조건','SUM(total_amount) >= 100000'],['범위','논리 절 설명 · 물리 계획 미실측']],['source-group-having-limit20'],['source.block11.events.0']),
]},
{id:'exists',question:'자식 존재 조회와 NULL 목록은 어떻게 다를까?',source:scope+' · 원문 block09 EXISTS / 추가 NULL 비교',sourceNote:'원문 EXISTS는 정렬을 지정하지 않았습니다. 96개 회원 집합·중복 없음만 관측하며 반환 배열 순서를 보장하지 않습니다.',note:sqlNotes,stages:[
 stage('exists','parents','EXISTS는 회원96명을 중복 없이','원문 PAID 주문 존재 조건을 만족한 회원은96개이고 id 중복은 없었습니다. 자식 주문 수만큼 회원 행을 복제하지 않았습니다.',sql('source.block9.events.1'),[['실측 회원 수','96'],['서로 다른 member id 수','96'],['정렬 계약','ORDER BY 없음 · 순서 보장 안 함']],['source-exists-unique96-members'],['source.block9.events.1']),
 stage('exists','null','NOT IN의 NULL은 UNKNOWN','추가 비교에서 NULL=NULL과2 NOT IN(1,NULL)은NULL이었습니다. NULL IS NULL과 값2가 없는 NOT EXISTS는1로 읽혔습니다.','SELECT NULL=NULL AS equals_null,NULL IS NULL AS is_null,\n2 NOT IN(1,NULL)AS not_in,\nNOT EXISTS(SELECT 1 FROM(SELECT 1 AS value UNION ALL SELECT NULL)q WHERE q.value=2)AS not_exists;',[['equals_null / not_in','NULL / NULL · UNKNOWN'],['is_null / not_exists','1 / 1'],['범위','추가 상수·서브쿼리 비교']],['extra-null-unknown-notin-vs-notexists'],['extra.nullComparisons']),
]},
{id:'dml',question:'원문 변경 중 writer와 observer는 무엇을 봤을까?',source:scope+' · 원문 block13 + 명시적 추가 snapshot',sourceNote:'현재 코드 발췌는 원문 block13의 START TRANSACTION→ROLLBACK 중간 발췌입니다. 전체 트랜잭션 복사는 START부터 ROLLBACK 뒤 검증 SELECT까지 원문 전체를 복사합니다. 원문 DML 표현식은 그대로이며 INSERT3회·ROW_COUNT 조회2회 뒤 writer snapshot과 DML5회 직후 독립 observer를 구분합니다. ROW_COUNT 직전에 추가 writer SELECT는 넣지 않았습니다.',note:'모든 원문 demo 변경은 마지막에ROLLBACK했습니다. 원문 신규 coupon 경로와 별도 r04_extra UPSERT affectedRows는 서로 다른 실험입니다. '+limits,stages:[
 stage('dml','products','두 상품은 writer에만81·82','원문 다중 INSERT는 상품2개를 만들었습니다. 추가 writer snapshot은 id81·82를 읽지만 같은 단계의 독립 observer는 두 상품을 보지 못했습니다.',sql('source.block13.events.0')+'\n'+sql('source.block13.events.1'),[['writer 상품','id81 R04 상품 A price1000 stock3 / id82 R04 상품 B price2000 stock5'],['INSERT affectedRows','2'],['같은 시점 observer 상품','[]']],['source-uncommitted-mutations-invisible'],['source.block13.events.1','source.block13.events.2','source.block13.events.3'],{active:[0,1,2,3,4]}),
 stage('dml','coupon','원문 coupon11과 추가 UPSERT 구분','원문 R04-DEMO는 신규 coupon id11·discount1000을 만들었고 observer는0건입니다. 별도 upsert_probe는 email UNIQUE 충돌에서도 갱신되어 affectedRows가1·2·0이었습니다.',sql('source.block13.events.4'),[['원문 writer coupon','id11 / R04-DEMO / discount_amount1000'],['원문 observer couponRows','0'],['추가 upsert_probe affectedRows','new1 / unique changed2 / unchanged0'],['추가 최종 행','id1 / a@example.invalid / amount20'],['클라이언트 조건','PyMySQL CLIENT_FOUND_ROWS=false · JDBC 모드로 일반화 금지']],['extra-upsert-any-unique-not-only-pk','extra-upsert-affected1-2-0-default-client-flags'],['source.block13.events.4','source.block13.events.5','source.block13.events.6','extra.upsert','runtime.clientFoundRows']),
 stage('dml','points','INSERT SELECT는 주문1에서 포인트 생성','원문 INSERT SELECT가 주문1의 member1을 읽어 point_history id1501·amount100을 만들었습니다. 추가 writer에는 보이지만 observer 포인트는0건입니다.',sql('source.block13.events.7'),[['writer point_history','id1501 / member_id1 / order_id1 / amount100'],['INSERT affectedRows','1'],['observer pointRows','0']],['source-insert-writer-sees-two-products-coupon-point'],['source.block13.events.7','source.block13.events.8','source.block13.events.9']),
 stage('dml','stock','stock은 writer32·observer33','원문 WHERE id1 AND stock>0 변경은1행입니다. ROW_COUNT는 바로1을 반환했고 그 뒤 추가 writer snapshot은32, 독립 observer는33이었습니다.',sql('source.block13.events.10')+'\n'+sql('source.block13.events.11')+'\n'+sql('source.block13.events.13'),[['원문 UPDATE ROW_COUNT','1'],['추가 writer stock','32'],['독립 observer stock','33'],['snapshot 시점','observer는별도연결 / writer는ROW_COUNT 뒤']],['source-stock32-and-deleted-membercoupon-only-writer','source-update-delete-each1'],['source.block13.events.11','source.block13.events.12','source.block13.events.13','source.block13.events.14']),
 stage('dml','delete','쿠폰300은 writer에서만 사라짐','원문은 member_coupon id300을 사전 조회한 뒤 같은PK로 삭제했습니다. deleted_rows=1 이후 추가 writer에는 없고 observer에는 아직1건입니다.',sql('source.block13.events.15')+'\n'+sql('source.block13.events.16')+'\n'+sql('source.block13.events.18'),[['삭제 대상','member_coupon id300 / member_id100 / EXPIRED'],['원문 DELETE ROW_COUNT','1'],['추가 writer memberCoupon300','[]'],['observer memberCoupon300','1']],['source-update-delete-each1'],['source.block13.events.15','source.block13.events.16','source.block13.events.17','source.block13.events.18','source.block13.events.19']),
 stage('dml','rollback','원문 ROLLBACK 뒤 초기 상태 복구','원문 ROLLBACK과 마지막4개 SELECT를 실행했습니다. stock33, demo coupon·point0, member_coupon300은1건이며 추가 writer·observer도 초기 snapshot과 같습니다.',sql('source.block13.events.20')+'\n'+[21,22,23,24].map(i=>sql('source.block13.events.'+i)).join('\n'),[['product1 stock','33'],['추가상품 / demo coupon / point','0 / 0 / 0'],['member_coupon300','1'],['writer / observer','각 초기 snapshot과 같음']],['source-rollback-restores-stock-and-coupon-point-membercoupon','source-final-original-selects'],['source.afterRollback','source.afterRollbackWriter','source.block13.events.20','source.block13.events.21','source.block13.events.22','source.block13.events.23','source.block13.events.24']),
]},
{id:'transaction',question:'나중 ROLLBACK은 어느 변경까지 취소할까?',source:scope+' · 추가 r04_extra transaction probe',sourceNote:'이 네 가지는 원문 demo와 다른 추가 작은 테이블입니다. autocommit·명시commit·CHECK3819·통제된 두 연결 교차 실행을 구분합니다.',note:'한 CHECK 오류의 관측을 모든 에러·deadlock의 처리로 일반화하지 않습니다. 교차 실행은 통제된 문장 순서이며 thread 부하시험이나 시간 측정이 아닙니다. '+limits,stages:[
 stage('transaction','autocommit','autocommit 성공 뒤 ROLLBACK에도 남음','추가 autocommit_probe id1을 기본autocommit1에서 INSERT한 뒤 ROLLBACK했습니다. observer에도 id1은 남았습니다.','INSERT INTO autocommit_probe VALUES(1);\nROLLBACK;',[['runtime autocommit','1'],['추가 observer 결과','[{id:1}]'],['의미','성공문장 이미확정 · 후속ROLLBACK으로취소안됨']],['extra-autocommit-insert-survives-later-rollback'],['runtime.autocommit','extra.autocommitAfterRollback'],{active:[0,1]}),
 stage('transaction','commit','명시 COMMIT 뒤에도 취소 안 됨','다음 별도transaction에서 id2를 INSERT했습니다. commit 전 observer는id1만, COMMIT 후 ROLLBACK해도 observer는id1·2를 읽습니다.','START TRANSACTION;\nINSERT INTO autocommit_probe VALUES(2);\nCOMMIT;\nROLLBACK;',[['commit전 observer','[{id:1}]'],['commit후ROLLBACK뒤 observer','[{id:1},{id:2}]'],['작업범위','추가 작은 테이블 · 원문demo commit아님']],['extra-explicit-commit-survives-later-rollback'],['extra.explicitCommit'],{active:[0,1,2,3]}),
 stage('transaction','statement','이 CHECK 실패는 앞 INSERT까지 취소 안 함','추가 transaction에서 id1·amount10 INSERT 뒤 id2·amount-1이CHECK3819로 실패했습니다. 명시ROLLBACK 전 writer는앞행을 읽고 observer는없으며 ROLLBACK 뒤앞행도없습니다.','START TRANSACTION;\nINSERT INTO statement_probe VALUES(1,10);\nINSERT INTO statement_probe VALUES(2,-1);\n-- CHECK3819 뒤 writer/observer 관찰\nROLLBACK;',[['실측 실패','3819 · statement_probe CHECK'],['명시ROLLBACK전 writer','[{id:1,amount:10}]'],['같은시점 observer','[]'],['명시ROLLBACK뒤','[] · 앞성공문장도취소']],['extra-check-statement3819','extra-statement-error-does-not-auto-rollback-earlier-insert'],['extra.statementError'],{active:[1,2,4]}),
 stage('transaction','interleaving','사전 SELECT 뒤 다른 연결이 변경 가능','통제된 추가순서에서 writer는stock1을 읽었습니다. observer가autocommit으로0으로 바꾼 뒤 writer의 stock>0 guard는0행이었습니다. 사전SELECT가 다른writer를 잠근것은아닙니다.','SELECT id,stock FROM race_probe WHERE id=1;\n-- 별도observer가다음문장실행\nUPDATE r04_extra.race_probe SET stock=0 WHERE id=1;\n-- 원래writer가다음guard실행\nUPDATE race_probe SET stock=stock-1 WHERE id=1 AND stock>0;',[['첫plainSELECT','id1 / stock1'],['다른연결autocommit','stock0 / affectedRows1'],['원래writer guard','affectedRows0'],['최종값','id1 / stock0'],['범위','통제된interleave · 부하시험/lock시간미측정']],['extra-precheck-select-does-not-lock-out-other-writer'],['extra.controlledInterleaving'],{active:[0,2,4]}),
]},
{id:'safety',question:'별칭·집계·변경 조건은 어떤 오류를 냈을까?',source:scope+' · 추가 r04_extra 오류·대조군',sourceNote:'원문오타를고쳤다고표시하지않고 별도추가잘못된문장과대조군을실행했습니다. sql_safe_updates=1은추가session조건이며원문bash --safe-updates를실행한것이아닙니다.',note:'ONLY_FULL_GROUP_BY의functional dependency 예외를구분합니다. 오류코드는이입력/설정의관측이며모든SQL실패를동일하게처리한실험이아닙니다. '+limits,stages:[
 stage('safety','alias','SELECT 별칭을 WHERE에서 쓰면1054','추가쿼리는 total_amount AS amount의 amount를WHERE에서참조했습니다. 이입력은Unknown column1054였습니다.',sql('extra.aliasWhere'),[['별칭','amount'],['사용한절','WHERE amount>0'],['실측오류','1054 · Unknown column amount']],['extra-select-alias-where1054'],['extra.aliasWhere']),
 stage('safety','ambiguous','한정 없는 id는1052','member와orders가함께있는추가JOIN에서어느쪽인지정하지않은id를SELECT했습니다. 실제오류는1052였습니다.',sql('extra.ambiguous'),[['한정없는열','id'],['후보테이블','member / orders'],['실측오류','1052 · ambiguous']],['extra-unqualified-id1052'],['extra.ambiguous']),
 stage('safety','where','WHERE COUNT(*)는1111','추가WHERE COUNT(*)>1은집계함수를잘못쓴입력으로1111이었습니다. 원문의HAVING쿼리성공과구분합니다.',sql('extra.aggregateWhere'),[['조건','WHERE COUNT(*)>1'],['실측오류','1111 · Invalid use of group function'],['원문대조','HAVING은그룹결과조건']],['extra-aggregate-in-where1111'],['extra.aggregateWhere']),
 stage('safety','group','1055와 PK 함수 종속성 허용 비교','회원별GROUP BY에결정되지않은order_no를선택한문장은1055였습니다. 별도idPK로GROUP BY한대조군은order_no가함수종속돼id1·주문번호·n1을읽었습니다.',sql('extra.notGrouped')+'\n-- 추가성공대조군\nSELECT id,order_no,COUNT(*)AS n FROM ds_practice.orders WHERE id=1 GROUP BY id;',[['잘못된그룹입력','member_id 그룹 / 미결정 order_no'],['실측오류','1055 · ONLY_FULL_GROUP_BY'],['PK대조군결과','id1 / ORD-2026-00001 / n1'],['해석','모든비GROUP열이항상금지되는것은아님']],['extra-nondetermined-order-no1055','extra-pk-functional-dependency-allowed'],['extra.notGrouped','extra.functionalDependency']),
 stage('safety','safe','별도 safe-updates는1175','추가safe_probe id1값10·id2값20에서세션sql_safe_updates=1로키조건없는UPDATE를시도했습니다.1175로거부됐고두값은유지됐습니다.','SET SESSION sql_safe_updates=1;\nUPDATE safe_probe SET value=99;',[['추가session조건','sql_safe_updates=1'],['실측오류','1175 · key WHERE 없는변경'],['관측행유지','id1 value10 / id2 value20'],['원문환경과구분','이추가세션에서만검사']],['extra-safe-update-no-key1175','extra-safe-update-rows-unchanged'],['extra.safeUpdate'],{active:[0,1]}),
]},
];
export const R04_ASSETS={
  "R04-select": {
    "file": "R04-select.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 select 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "select-result": [
        1,
        15,
        52,
        74
      ],
      "select-logical": [
        54,
        15,
        45,
        74
      ]
    }
  },
  "R04-jdbc": {
    "file": "R04-jdbc-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 jdbc 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "jdbc-bind": [
        1,
        12,
        33,
        75
      ],
      "jdbc-map": [
        1,
        54,
        33,
        33
      ],
      "jdbc-empty": [
        35,
        12,
        31,
        75
      ],
      "jdbc-identifier": [
        67,
        12,
        32,
        75
      ]
    }
  },
  "R04-joins": {
    "file": "R04-joins-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 joins 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "joins-inner": [
        1,
        16,
        32,
        74
      ],
      "joins-left": [
        34,
        16,
        32,
        74
      ],
      "joins-right": [
        67,
        16,
        32,
        74
      ]
    }
  },
  "R04-crossself": {
    "file": "R04-crossself-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 crossself 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "crossself-cross": [
        1,
        10,
        46,
        83
      ],
      "crossself-self": [
        48,
        10,
        51,
        83
      ]
    }
  },
  "R04-outer": {
    "file": "R04-outer-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 outer 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "outer-on": [
        1,
        23,
        29,
        57
      ],
      "outer-where": [
        35,
        23,
        30,
        57
      ],
      "outer-count": [
        70,
        23,
        29,
        57
      ]
    }
  },
  "R04-aggregate": {
    "file": "R04-aggregate.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 aggregate 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "aggregate-fanout": [
        1,
        9,
        31,
        82
      ],
      "aggregate-distinct": [
        33,
        9,
        34,
        82
      ],
      "aggregate-groups": [
        68,
        9,
        31,
        82
      ]
    }
  },
  "R04-exists": {
    "file": "R04-exists-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 exists 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "exists-parents": [
        1,
        15,
        48,
        75
      ],
      "exists-null": [
        51,
        15,
        48,
        75
      ]
    }
  },
  "R04-dml": {
    "file": "R04-dml-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 dml 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "dml-products": [
        1,
        10,
        32,
        38
      ],
      "dml-coupon": [
        34,
        10,
        32,
        38
      ],
      "dml-points": [
        67,
        10,
        32,
        38
      ],
      "dml-stock": [
        1,
        51,
        32,
        38
      ],
      "dml-delete": [
        34,
        51,
        32,
        38
      ],
      "dml-rollback": [
        67,
        51,
        32,
        38
      ]
    }
  },
  "R04-transaction": {
    "file": "R04-transaction-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 transaction 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "transaction-autocommit": [
        1,
        10,
        52,
        41
      ],
      "transaction-commit": [
        54,
        10,
        45,
        41
      ],
      "transaction-statement": [
        1,
        52,
        56,
        43
      ],
      "transaction-interleaving": [
        58,
        52,
        41,
        43
      ]
    }
  },
  "R04-safety": {
    "file": "R04-safety-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문SQL·JDBC와 추가실험의 safety 관측값. 독립MySQL8.4.11의 일부 장면.",
    "focus": {
      "safety-alias": [
        0.5,
        10,
        19,
        62
      ],
      "safety-ambiguous": [
        20.5,
        10,
        19,
        62
      ],
      "safety-where": [
        40.5,
        10,
        18,
        62
      ],
      "safety-group": [
        59,
        10,
        21,
        62
      ],
      "safety-safe": [
        80.5,
        10,
        19,
        62
      ]
    }
  }
};
