// W15 원문 SQL/Java와 명시한 추가 Article·관찰 fixture의 frozen 실행이다.
export const w15AssetRoot = '../design/w15-2026-10-20/images/';
export const W15_RUNS = {
  "runtime": {
    "mysql": "8.4.11",
    "machine": "arm64",
    "os": "macos15",
    "sqlMode": "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
    "autocommit": 1,
    "isolation": "REPEATABLE-READ",
    "timeZone": "+00:00",
    "jdbcTransport": "fresh127.0.0.1-only port / random SELECT-only account / sslMode REQUIRED; existing DB never used"
  },
  "fixture": {
    "scope": "added private Article assumption, not learner schema or original ds_practice.article",
    "ddl": "CREATE TABLE article(id BIGINT PRIMARY KEY,published_at DATETIME(6) NOT NULL,status VARCHAR(16) NOT NULL,title VARCHAR(160) NOT NULL,INDEX idx_feed(status,published_at DESC,id DESC,title))",
    "published": 600,
    "draft": 37,
    "firstTimestampTieRows": 70,
    "seed": [
      [
        700049,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 000"
      ],
      [
        700048,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 001"
      ],
      [
        700047,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 002"
      ],
      [
        700046,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 003"
      ],
      [
        700045,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 004"
      ],
      [
        700044,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 005"
      ],
      [
        700043,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 006"
      ],
      [
        700042,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 007"
      ],
      [
        700041,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 008"
      ],
      [
        700040,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 009"
      ],
      [
        700039,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 010"
      ],
      [
        700038,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 011"
      ],
      [
        700037,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 012"
      ],
      [
        700036,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 013"
      ],
      [
        700035,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 014"
      ],
      [
        700034,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 015"
      ],
      [
        700033,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 016"
      ],
      [
        700032,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 017"
      ],
      [
        700031,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 018"
      ],
      [
        700030,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 019"
      ],
      [
        700029,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 020"
      ],
      [
        700028,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 021"
      ],
      [
        700027,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 022"
      ],
      [
        700026,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 023"
      ],
      [
        700025,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 024"
      ],
      [
        700024,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 025"
      ],
      [
        700023,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 026"
      ],
      [
        700022,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 027"
      ],
      [
        700021,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 028"
      ],
      [
        700020,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 029"
      ],
      [
        700019,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 030"
      ],
      [
        700018,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 031"
      ],
      [
        700017,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 032"
      ],
      [
        700016,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 033"
      ],
      [
        700015,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 034"
      ],
      [
        700014,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 035"
      ],
      [
        700013,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 036"
      ],
      [
        700012,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 037"
      ],
      [
        700011,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 038"
      ],
      [
        700010,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 039"
      ],
      [
        700009,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 040"
      ],
      [
        700008,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 041"
      ],
      [
        700007,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 042"
      ],
      [
        700006,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 043"
      ],
      [
        700005,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 044"
      ],
      [
        700004,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 045"
      ],
      [
        700003,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 046"
      ],
      [
        700002,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 047"
      ],
      [
        700001,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 048"
      ],
      [
        700000,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 049"
      ],
      [
        699999,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 050"
      ],
      [
        699998,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 051"
      ],
      [
        699997,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 052"
      ],
      [
        699996,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 053"
      ],
      [
        699995,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 054"
      ],
      [
        699994,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 055"
      ],
      [
        699993,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 056"
      ],
      [
        699992,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 057"
      ],
      [
        699991,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 058"
      ],
      [
        699990,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 059"
      ],
      [
        699989,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 060"
      ],
      [
        699988,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 061"
      ],
      [
        699987,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 062"
      ],
      [
        699986,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 063"
      ],
      [
        699985,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 064"
      ],
      [
        699984,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 065"
      ],
      [
        699983,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 066"
      ],
      [
        699982,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 067"
      ],
      [
        699981,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 068"
      ],
      [
        699980,
        "2026-09-01 12:00:00",
        "PUBLISHED",
        "W15 article 069"
      ],
      [
        699979,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 070"
      ],
      [
        699978,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 071"
      ],
      [
        699977,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 072"
      ],
      [
        699976,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 073"
      ],
      [
        699975,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 074"
      ],
      [
        699974,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 075"
      ],
      [
        699973,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 076"
      ],
      [
        699972,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 077"
      ],
      [
        699971,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 078"
      ],
      [
        699970,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 079"
      ],
      [
        699969,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 080"
      ],
      [
        699968,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 081"
      ],
      [
        699967,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 082"
      ],
      [
        699966,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 083"
      ],
      [
        699965,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 084"
      ],
      [
        699964,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 085"
      ],
      [
        699963,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 086"
      ],
      [
        699962,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 087"
      ],
      [
        699961,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 088"
      ],
      [
        699960,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 089"
      ],
      [
        699959,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 090"
      ],
      [
        699958,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 091"
      ],
      [
        699957,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 092"
      ],
      [
        699956,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 093"
      ],
      [
        699955,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 094"
      ],
      [
        699954,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 095"
      ],
      [
        699953,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 096"
      ],
      [
        699952,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 097"
      ],
      [
        699951,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 098"
      ],
      [
        699950,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 099"
      ],
      [
        699949,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 100"
      ],
      [
        699948,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 101"
      ],
      [
        699947,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 102"
      ],
      [
        699946,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 103"
      ],
      [
        699945,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 104"
      ],
      [
        699944,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 105"
      ],
      [
        699943,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 106"
      ],
      [
        699942,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 107"
      ],
      [
        699941,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 108"
      ],
      [
        699940,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 109"
      ],
      [
        699939,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 110"
      ],
      [
        699938,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 111"
      ],
      [
        699937,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 112"
      ],
      [
        699936,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 113"
      ],
      [
        699935,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 114"
      ],
      [
        699934,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 115"
      ],
      [
        699933,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 116"
      ],
      [
        699932,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 117"
      ],
      [
        699931,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 118"
      ],
      [
        699930,
        "2026-09-01 11:59:00",
        "PUBLISHED",
        "W15 article 119"
      ],
      [
        699929,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 120"
      ],
      [
        699928,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 121"
      ],
      [
        699927,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 122"
      ],
      [
        699926,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 123"
      ],
      [
        699925,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 124"
      ],
      [
        699924,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 125"
      ],
      [
        699923,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 126"
      ],
      [
        699922,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 127"
      ],
      [
        699921,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 128"
      ],
      [
        699920,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 129"
      ],
      [
        699919,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 130"
      ],
      [
        699918,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 131"
      ],
      [
        699917,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 132"
      ],
      [
        699916,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 133"
      ],
      [
        699915,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 134"
      ],
      [
        699914,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 135"
      ],
      [
        699913,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 136"
      ],
      [
        699912,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 137"
      ],
      [
        699911,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 138"
      ],
      [
        699910,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 139"
      ],
      [
        699909,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 140"
      ],
      [
        699908,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 141"
      ],
      [
        699907,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 142"
      ],
      [
        699906,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 143"
      ],
      [
        699905,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 144"
      ],
      [
        699904,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 145"
      ],
      [
        699903,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 146"
      ],
      [
        699902,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 147"
      ],
      [
        699901,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 148"
      ],
      [
        699900,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 149"
      ],
      [
        699899,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 150"
      ],
      [
        699898,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 151"
      ],
      [
        699897,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 152"
      ],
      [
        699896,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 153"
      ],
      [
        699895,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 154"
      ],
      [
        699894,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 155"
      ],
      [
        699893,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 156"
      ],
      [
        699892,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 157"
      ],
      [
        699891,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 158"
      ],
      [
        699890,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 159"
      ],
      [
        699889,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 160"
      ],
      [
        699888,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 161"
      ],
      [
        699887,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 162"
      ],
      [
        699886,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 163"
      ],
      [
        699885,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 164"
      ],
      [
        699884,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 165"
      ],
      [
        699883,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 166"
      ],
      [
        699882,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 167"
      ],
      [
        699881,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 168"
      ],
      [
        699880,
        "2026-09-01 11:58:00",
        "PUBLISHED",
        "W15 article 169"
      ],
      [
        699879,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 170"
      ],
      [
        699878,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 171"
      ],
      [
        699877,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 172"
      ],
      [
        699876,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 173"
      ],
      [
        699875,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 174"
      ],
      [
        699874,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 175"
      ],
      [
        699873,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 176"
      ],
      [
        699872,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 177"
      ],
      [
        699871,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 178"
      ],
      [
        699870,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 179"
      ],
      [
        699869,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 180"
      ],
      [
        699868,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 181"
      ],
      [
        699867,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 182"
      ],
      [
        699866,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 183"
      ],
      [
        699865,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 184"
      ],
      [
        699864,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 185"
      ],
      [
        699863,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 186"
      ],
      [
        699862,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 187"
      ],
      [
        699861,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 188"
      ],
      [
        699860,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 189"
      ],
      [
        699859,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 190"
      ],
      [
        699858,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 191"
      ],
      [
        699857,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 192"
      ],
      [
        699856,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 193"
      ],
      [
        699855,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 194"
      ],
      [
        699854,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 195"
      ],
      [
        699853,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 196"
      ],
      [
        699852,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 197"
      ],
      [
        699851,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 198"
      ],
      [
        699850,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 199"
      ],
      [
        699849,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 200"
      ],
      [
        699848,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 201"
      ],
      [
        699847,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 202"
      ],
      [
        699846,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 203"
      ],
      [
        699845,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 204"
      ],
      [
        699844,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 205"
      ],
      [
        699843,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 206"
      ],
      [
        699842,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 207"
      ],
      [
        699841,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 208"
      ],
      [
        699840,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 209"
      ],
      [
        699839,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 210"
      ],
      [
        699838,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 211"
      ],
      [
        699837,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 212"
      ],
      [
        699836,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 213"
      ],
      [
        699835,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 214"
      ],
      [
        699834,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 215"
      ],
      [
        699833,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 216"
      ],
      [
        699832,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 217"
      ],
      [
        699831,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 218"
      ],
      [
        699830,
        "2026-09-01 11:57:00",
        "PUBLISHED",
        "W15 article 219"
      ],
      [
        699829,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 220"
      ],
      [
        699828,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 221"
      ],
      [
        699827,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 222"
      ],
      [
        699826,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 223"
      ],
      [
        699825,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 224"
      ],
      [
        699824,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 225"
      ],
      [
        699823,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 226"
      ],
      [
        699822,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 227"
      ],
      [
        699821,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 228"
      ],
      [
        699820,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 229"
      ],
      [
        699819,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 230"
      ],
      [
        699818,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 231"
      ],
      [
        699817,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 232"
      ],
      [
        699816,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 233"
      ],
      [
        699815,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 234"
      ],
      [
        699814,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 235"
      ],
      [
        699813,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 236"
      ],
      [
        699812,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 237"
      ],
      [
        699811,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 238"
      ],
      [
        699810,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 239"
      ],
      [
        699809,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 240"
      ],
      [
        699808,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 241"
      ],
      [
        699807,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 242"
      ],
      [
        699806,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 243"
      ],
      [
        699805,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 244"
      ],
      [
        699804,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 245"
      ],
      [
        699803,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 246"
      ],
      [
        699802,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 247"
      ],
      [
        699801,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 248"
      ],
      [
        699800,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 249"
      ],
      [
        699799,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 250"
      ],
      [
        699798,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 251"
      ],
      [
        699797,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 252"
      ],
      [
        699796,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 253"
      ],
      [
        699795,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 254"
      ],
      [
        699794,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 255"
      ],
      [
        699793,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 256"
      ],
      [
        699792,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 257"
      ],
      [
        699791,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 258"
      ],
      [
        699790,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 259"
      ],
      [
        699789,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 260"
      ],
      [
        699788,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 261"
      ],
      [
        699787,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 262"
      ],
      [
        699786,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 263"
      ],
      [
        699785,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 264"
      ],
      [
        699784,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 265"
      ],
      [
        699783,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 266"
      ],
      [
        699782,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 267"
      ],
      [
        699781,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 268"
      ],
      [
        699780,
        "2026-09-01 11:56:00",
        "PUBLISHED",
        "W15 article 269"
      ],
      [
        699779,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 270"
      ],
      [
        699778,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 271"
      ],
      [
        699777,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 272"
      ],
      [
        699776,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 273"
      ],
      [
        699775,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 274"
      ],
      [
        699774,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 275"
      ],
      [
        699773,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 276"
      ],
      [
        699772,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 277"
      ],
      [
        699771,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 278"
      ],
      [
        699770,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 279"
      ],
      [
        699769,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 280"
      ],
      [
        699768,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 281"
      ],
      [
        699767,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 282"
      ],
      [
        699766,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 283"
      ],
      [
        699765,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 284"
      ],
      [
        699764,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 285"
      ],
      [
        699763,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 286"
      ],
      [
        699762,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 287"
      ],
      [
        699761,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 288"
      ],
      [
        699760,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 289"
      ],
      [
        699759,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 290"
      ],
      [
        699758,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 291"
      ],
      [
        699757,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 292"
      ],
      [
        699756,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 293"
      ],
      [
        699755,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 294"
      ],
      [
        699754,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 295"
      ],
      [
        699753,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 296"
      ],
      [
        699752,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 297"
      ],
      [
        699751,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 298"
      ],
      [
        699750,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 299"
      ],
      [
        699749,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 300"
      ],
      [
        699748,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 301"
      ],
      [
        699747,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 302"
      ],
      [
        699746,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 303"
      ],
      [
        699745,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 304"
      ],
      [
        699744,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 305"
      ],
      [
        699743,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 306"
      ],
      [
        699742,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 307"
      ],
      [
        699741,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 308"
      ],
      [
        699740,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 309"
      ],
      [
        699739,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 310"
      ],
      [
        699738,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 311"
      ],
      [
        699737,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 312"
      ],
      [
        699736,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 313"
      ],
      [
        699735,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 314"
      ],
      [
        699734,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 315"
      ],
      [
        699733,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 316"
      ],
      [
        699732,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 317"
      ],
      [
        699731,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 318"
      ],
      [
        699730,
        "2026-09-01 11:55:00",
        "PUBLISHED",
        "W15 article 319"
      ],
      [
        699729,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 320"
      ],
      [
        699728,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 321"
      ],
      [
        699727,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 322"
      ],
      [
        699726,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 323"
      ],
      [
        699725,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 324"
      ],
      [
        699724,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 325"
      ],
      [
        699723,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 326"
      ],
      [
        699722,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 327"
      ],
      [
        699721,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 328"
      ],
      [
        699720,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 329"
      ],
      [
        699719,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 330"
      ],
      [
        699718,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 331"
      ],
      [
        699717,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 332"
      ],
      [
        699716,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 333"
      ],
      [
        699715,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 334"
      ],
      [
        699714,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 335"
      ],
      [
        699713,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 336"
      ],
      [
        699712,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 337"
      ],
      [
        699711,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 338"
      ],
      [
        699710,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 339"
      ],
      [
        699709,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 340"
      ],
      [
        699708,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 341"
      ],
      [
        699707,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 342"
      ],
      [
        699706,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 343"
      ],
      [
        699705,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 344"
      ],
      [
        699704,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 345"
      ],
      [
        699703,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 346"
      ],
      [
        699702,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 347"
      ],
      [
        699701,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 348"
      ],
      [
        699700,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 349"
      ],
      [
        699699,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 350"
      ],
      [
        699698,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 351"
      ],
      [
        699697,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 352"
      ],
      [
        699696,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 353"
      ],
      [
        699695,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 354"
      ],
      [
        699694,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 355"
      ],
      [
        699693,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 356"
      ],
      [
        699692,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 357"
      ],
      [
        699691,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 358"
      ],
      [
        699690,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 359"
      ],
      [
        699689,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 360"
      ],
      [
        699688,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 361"
      ],
      [
        699687,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 362"
      ],
      [
        699686,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 363"
      ],
      [
        699685,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 364"
      ],
      [
        699684,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 365"
      ],
      [
        699683,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 366"
      ],
      [
        699682,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 367"
      ],
      [
        699681,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 368"
      ],
      [
        699680,
        "2026-09-01 11:54:00",
        "PUBLISHED",
        "W15 article 369"
      ],
      [
        699679,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 370"
      ],
      [
        699678,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 371"
      ],
      [
        699677,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 372"
      ],
      [
        699676,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 373"
      ],
      [
        699675,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 374"
      ],
      [
        699674,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 375"
      ],
      [
        699673,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 376"
      ],
      [
        699672,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 377"
      ],
      [
        699671,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 378"
      ],
      [
        699670,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 379"
      ],
      [
        699669,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 380"
      ],
      [
        699668,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 381"
      ],
      [
        699667,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 382"
      ],
      [
        699666,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 383"
      ],
      [
        699665,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 384"
      ],
      [
        699664,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 385"
      ],
      [
        699663,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 386"
      ],
      [
        699662,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 387"
      ],
      [
        699661,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 388"
      ],
      [
        699660,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 389"
      ],
      [
        699659,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 390"
      ],
      [
        699658,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 391"
      ],
      [
        699657,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 392"
      ],
      [
        699656,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 393"
      ],
      [
        699655,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 394"
      ],
      [
        699654,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 395"
      ],
      [
        699653,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 396"
      ],
      [
        699652,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 397"
      ],
      [
        699651,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 398"
      ],
      [
        699650,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 399"
      ],
      [
        699649,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 400"
      ],
      [
        699648,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 401"
      ],
      [
        699647,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 402"
      ],
      [
        699646,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 403"
      ],
      [
        699645,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 404"
      ],
      [
        699644,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 405"
      ],
      [
        699643,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 406"
      ],
      [
        699642,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 407"
      ],
      [
        699641,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 408"
      ],
      [
        699640,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 409"
      ],
      [
        699639,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 410"
      ],
      [
        699638,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 411"
      ],
      [
        699637,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 412"
      ],
      [
        699636,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 413"
      ],
      [
        699635,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 414"
      ],
      [
        699634,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 415"
      ],
      [
        699633,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 416"
      ],
      [
        699632,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 417"
      ],
      [
        699631,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 418"
      ],
      [
        699630,
        "2026-09-01 11:53:00",
        "PUBLISHED",
        "W15 article 419"
      ],
      [
        699629,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 420"
      ],
      [
        699628,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 421"
      ],
      [
        699627,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 422"
      ],
      [
        699626,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 423"
      ],
      [
        699625,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 424"
      ],
      [
        699624,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 425"
      ],
      [
        699623,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 426"
      ],
      [
        699622,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 427"
      ],
      [
        699621,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 428"
      ],
      [
        699620,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 429"
      ],
      [
        699619,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 430"
      ],
      [
        699618,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 431"
      ],
      [
        699617,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 432"
      ],
      [
        699616,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 433"
      ],
      [
        699615,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 434"
      ],
      [
        699614,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 435"
      ],
      [
        699613,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 436"
      ],
      [
        699612,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 437"
      ],
      [
        699611,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 438"
      ],
      [
        699610,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 439"
      ],
      [
        699609,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 440"
      ],
      [
        699608,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 441"
      ],
      [
        699607,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 442"
      ],
      [
        699606,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 443"
      ],
      [
        699605,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 444"
      ],
      [
        699604,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 445"
      ],
      [
        699603,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 446"
      ],
      [
        699602,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 447"
      ],
      [
        699601,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 448"
      ],
      [
        699600,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 449"
      ],
      [
        699599,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 450"
      ],
      [
        699598,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 451"
      ],
      [
        699597,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 452"
      ],
      [
        699596,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 453"
      ],
      [
        699595,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 454"
      ],
      [
        699594,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 455"
      ],
      [
        699593,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 456"
      ],
      [
        699592,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 457"
      ],
      [
        699591,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 458"
      ],
      [
        699590,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 459"
      ],
      [
        699589,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 460"
      ],
      [
        699588,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 461"
      ],
      [
        699587,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 462"
      ],
      [
        699586,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 463"
      ],
      [
        699585,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 464"
      ],
      [
        699584,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 465"
      ],
      [
        699583,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 466"
      ],
      [
        699582,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 467"
      ],
      [
        699581,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 468"
      ],
      [
        699580,
        "2026-09-01 11:52:00",
        "PUBLISHED",
        "W15 article 469"
      ],
      [
        699579,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 470"
      ],
      [
        699578,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 471"
      ],
      [
        699577,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 472"
      ],
      [
        699576,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 473"
      ],
      [
        699575,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 474"
      ],
      [
        699574,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 475"
      ],
      [
        699573,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 476"
      ],
      [
        699572,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 477"
      ],
      [
        699571,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 478"
      ],
      [
        699570,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 479"
      ],
      [
        699569,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 480"
      ],
      [
        699568,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 481"
      ],
      [
        699567,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 482"
      ],
      [
        699566,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 483"
      ],
      [
        699565,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 484"
      ],
      [
        699564,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 485"
      ],
      [
        699563,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 486"
      ],
      [
        699562,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 487"
      ],
      [
        699561,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 488"
      ],
      [
        699560,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 489"
      ],
      [
        699559,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 490"
      ],
      [
        699558,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 491"
      ],
      [
        699557,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 492"
      ],
      [
        699556,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 493"
      ],
      [
        699555,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 494"
      ],
      [
        699554,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 495"
      ],
      [
        699553,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 496"
      ],
      [
        699552,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 497"
      ],
      [
        699551,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 498"
      ],
      [
        699550,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 499"
      ],
      [
        699549,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 500"
      ],
      [
        699548,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 501"
      ],
      [
        699547,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 502"
      ],
      [
        699546,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 503"
      ],
      [
        699545,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 504"
      ],
      [
        699544,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 505"
      ],
      [
        699543,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 506"
      ],
      [
        699542,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 507"
      ],
      [
        699541,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 508"
      ],
      [
        699540,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 509"
      ],
      [
        699539,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 510"
      ],
      [
        699538,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 511"
      ],
      [
        699537,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 512"
      ],
      [
        699536,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 513"
      ],
      [
        699535,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 514"
      ],
      [
        699534,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 515"
      ],
      [
        699533,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 516"
      ],
      [
        699532,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 517"
      ],
      [
        699531,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 518"
      ],
      [
        699530,
        "2026-09-01 11:51:00",
        "PUBLISHED",
        "W15 article 519"
      ],
      [
        699529,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 520"
      ],
      [
        699528,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 521"
      ],
      [
        699527,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 522"
      ],
      [
        699526,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 523"
      ],
      [
        699525,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 524"
      ],
      [
        699524,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 525"
      ],
      [
        699523,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 526"
      ],
      [
        699522,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 527"
      ],
      [
        699521,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 528"
      ],
      [
        699520,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 529"
      ],
      [
        699519,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 530"
      ],
      [
        699518,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 531"
      ],
      [
        699517,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 532"
      ],
      [
        699516,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 533"
      ],
      [
        699515,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 534"
      ],
      [
        699514,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 535"
      ],
      [
        699513,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 536"
      ],
      [
        699512,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 537"
      ],
      [
        699511,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 538"
      ],
      [
        699510,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 539"
      ],
      [
        699509,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 540"
      ],
      [
        699508,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 541"
      ],
      [
        699507,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 542"
      ],
      [
        699506,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 543"
      ],
      [
        699505,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 544"
      ],
      [
        699504,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 545"
      ],
      [
        699503,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 546"
      ],
      [
        699502,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 547"
      ],
      [
        699501,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 548"
      ],
      [
        699500,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 549"
      ],
      [
        699499,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 550"
      ],
      [
        699498,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 551"
      ],
      [
        699497,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 552"
      ],
      [
        699496,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 553"
      ],
      [
        699495,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 554"
      ],
      [
        699494,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 555"
      ],
      [
        699493,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 556"
      ],
      [
        699492,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 557"
      ],
      [
        699491,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 558"
      ],
      [
        699490,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 559"
      ],
      [
        699489,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 560"
      ],
      [
        699488,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 561"
      ],
      [
        699487,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 562"
      ],
      [
        699486,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 563"
      ],
      [
        699485,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 564"
      ],
      [
        699484,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 565"
      ],
      [
        699483,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 566"
      ],
      [
        699482,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 567"
      ],
      [
        699481,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 568"
      ],
      [
        699480,
        "2026-09-01 11:50:00",
        "PUBLISHED",
        "W15 article 569"
      ],
      [
        699479,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 570"
      ],
      [
        699478,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 571"
      ],
      [
        699477,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 572"
      ],
      [
        699476,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 573"
      ],
      [
        699475,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 574"
      ],
      [
        699474,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 575"
      ],
      [
        699473,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 576"
      ],
      [
        699472,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 577"
      ],
      [
        699471,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 578"
      ],
      [
        699470,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 579"
      ],
      [
        699469,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 580"
      ],
      [
        699468,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 581"
      ],
      [
        699467,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 582"
      ],
      [
        699466,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 583"
      ],
      [
        699465,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 584"
      ],
      [
        699464,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 585"
      ],
      [
        699463,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 586"
      ],
      [
        699462,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 587"
      ],
      [
        699461,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 588"
      ],
      [
        699460,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 589"
      ],
      [
        699459,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 590"
      ],
      [
        699458,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 591"
      ],
      [
        699457,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 592"
      ],
      [
        699456,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 593"
      ],
      [
        699455,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 594"
      ],
      [
        699454,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 595"
      ],
      [
        699453,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 596"
      ],
      [
        699452,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 597"
      ],
      [
        699451,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 598"
      ],
      [
        699450,
        "2026-09-01 11:49:00",
        "PUBLISHED",
        "W15 article 599"
      ],
      [
        1000001,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 00"
      ],
      [
        1000002,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 01"
      ],
      [
        1000003,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 02"
      ],
      [
        1000004,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 03"
      ],
      [
        1000005,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 04"
      ],
      [
        1000006,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 05"
      ],
      [
        1000007,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 06"
      ],
      [
        1000008,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 07"
      ],
      [
        1000009,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 08"
      ],
      [
        1000010,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 09"
      ],
      [
        1000011,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 10"
      ],
      [
        1000012,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 11"
      ],
      [
        1000013,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 12"
      ],
      [
        1000014,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 13"
      ],
      [
        1000015,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 14"
      ],
      [
        1000016,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 15"
      ],
      [
        1000017,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 16"
      ],
      [
        1000018,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 17"
      ],
      [
        1000019,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 18"
      ],
      [
        1000020,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 19"
      ],
      [
        1000021,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 20"
      ],
      [
        1000022,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 21"
      ],
      [
        1000023,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 22"
      ],
      [
        1000024,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 23"
      ],
      [
        1000025,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 24"
      ],
      [
        1000026,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 25"
      ],
      [
        1000027,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 26"
      ],
      [
        1000028,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 27"
      ],
      [
        1000029,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 28"
      ],
      [
        1000030,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 29"
      ],
      [
        1000031,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 30"
      ],
      [
        1000032,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 31"
      ],
      [
        1000033,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 32"
      ],
      [
        1000034,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 33"
      ],
      [
        1000035,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 34"
      ],
      [
        1000036,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 35"
      ],
      [
        1000037,
        "2026-09-01 13:00:00",
        "DRAFT",
        "W15 draft 36"
      ]
    ]
  },
  "source": {
    "sql": [
      {
        "sql": "SELECT id, published_at, title\nFROM article\nWHERE status = 'PUBLISHED'\nORDER BY published_at DESC, id DESC\nLIMIT 50 OFFSET 0",
        "parameters": null,
        "rows": [
          {
            "id": 700049,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 000"
          },
          {
            "id": 700048,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 001"
          },
          {
            "id": 700047,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 002"
          },
          {
            "id": 700046,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 003"
          },
          {
            "id": 700045,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 004"
          },
          {
            "id": 700044,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 005"
          },
          {
            "id": 700043,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 006"
          },
          {
            "id": 700042,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 007"
          },
          {
            "id": 700041,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 008"
          },
          {
            "id": 700040,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 009"
          },
          {
            "id": 700039,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 010"
          },
          {
            "id": 700038,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 011"
          },
          {
            "id": 700037,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 012"
          },
          {
            "id": 700036,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 013"
          },
          {
            "id": 700035,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 014"
          },
          {
            "id": 700034,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 015"
          },
          {
            "id": 700033,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 016"
          },
          {
            "id": 700032,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 017"
          },
          {
            "id": 700031,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 018"
          },
          {
            "id": 700030,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 019"
          },
          {
            "id": 700029,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 020"
          },
          {
            "id": 700028,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 021"
          },
          {
            "id": 700027,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 022"
          },
          {
            "id": 700026,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 023"
          },
          {
            "id": 700025,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 024"
          },
          {
            "id": 700024,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 025"
          },
          {
            "id": 700023,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 026"
          },
          {
            "id": 700022,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 027"
          },
          {
            "id": 700021,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 028"
          },
          {
            "id": 700020,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 029"
          },
          {
            "id": 700019,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 030"
          },
          {
            "id": 700018,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 031"
          },
          {
            "id": 700017,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 032"
          },
          {
            "id": 700016,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 033"
          },
          {
            "id": 700015,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 034"
          },
          {
            "id": 700014,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 035"
          },
          {
            "id": 700013,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 036"
          },
          {
            "id": 700012,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 037"
          },
          {
            "id": 700011,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 038"
          },
          {
            "id": 700010,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 039"
          },
          {
            "id": 700009,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 040"
          },
          {
            "id": 700008,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 041"
          },
          {
            "id": 700007,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 042"
          },
          {
            "id": 700006,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 043"
          },
          {
            "id": 700005,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 044"
          },
          {
            "id": 700004,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 045"
          },
          {
            "id": 700003,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 046"
          },
          {
            "id": 700002,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 047"
          },
          {
            "id": 700001,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 048"
          },
          {
            "id": 700000,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 049"
          }
        ],
        "affectedRows": null,
        "connection": "writer"
      },
      {
        "sql": "SELECT id, published_at, title\nFROM article\nWHERE status = 'PUBLISHED'\nORDER BY published_at DESC, id DESC\nLIMIT 50 OFFSET 450",
        "parameters": null,
        "rows": [
          {
            "id": 699599,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 450"
          },
          {
            "id": 699598,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 451"
          },
          {
            "id": 699597,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 452"
          },
          {
            "id": 699596,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 453"
          },
          {
            "id": 699595,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 454"
          },
          {
            "id": 699594,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 455"
          },
          {
            "id": 699593,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 456"
          },
          {
            "id": 699592,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 457"
          },
          {
            "id": 699591,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 458"
          },
          {
            "id": 699590,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 459"
          },
          {
            "id": 699589,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 460"
          },
          {
            "id": 699588,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 461"
          },
          {
            "id": 699587,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 462"
          },
          {
            "id": 699586,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 463"
          },
          {
            "id": 699585,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 464"
          },
          {
            "id": 699584,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 465"
          },
          {
            "id": 699583,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 466"
          },
          {
            "id": 699582,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 467"
          },
          {
            "id": 699581,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 468"
          },
          {
            "id": 699580,
            "published_at": "2026-09-01 11:52:00",
            "title": "W15 article 469"
          },
          {
            "id": 699579,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 470"
          },
          {
            "id": 699578,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 471"
          },
          {
            "id": 699577,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 472"
          },
          {
            "id": 699576,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 473"
          },
          {
            "id": 699575,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 474"
          },
          {
            "id": 699574,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 475"
          },
          {
            "id": 699573,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 476"
          },
          {
            "id": 699572,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 477"
          },
          {
            "id": 699571,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 478"
          },
          {
            "id": 699570,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 479"
          },
          {
            "id": 699569,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 480"
          },
          {
            "id": 699568,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 481"
          },
          {
            "id": 699567,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 482"
          },
          {
            "id": 699566,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 483"
          },
          {
            "id": 699565,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 484"
          },
          {
            "id": 699564,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 485"
          },
          {
            "id": 699563,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 486"
          },
          {
            "id": 699562,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 487"
          },
          {
            "id": 699561,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 488"
          },
          {
            "id": 699560,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 489"
          },
          {
            "id": 699559,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 490"
          },
          {
            "id": 699558,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 491"
          },
          {
            "id": 699557,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 492"
          },
          {
            "id": 699556,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 493"
          },
          {
            "id": 699555,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 494"
          },
          {
            "id": 699554,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 495"
          },
          {
            "id": 699553,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 496"
          },
          {
            "id": 699552,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 497"
          },
          {
            "id": 699551,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 498"
          },
          {
            "id": 699550,
            "published_at": "2026-09-01 11:51:00",
            "title": "W15 article 499"
          }
        ],
        "affectedRows": null,
        "connection": "writer"
      },
      {
        "sql": "SELECT id, published_at, title\nFROM article\nWHERE status = 'PUBLISHED'\n  AND (published_at < TIMESTAMP '2026-09-01 12:00:00'\n       OR (published_at = TIMESTAMP '2026-09-01 12:00:00' AND id < 700000))\nORDER BY published_at DESC, id DESC\nLIMIT 51",
        "parameters": null,
        "rows": [
          {
            "id": 699999,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 050"
          },
          {
            "id": 699998,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 051"
          },
          {
            "id": 699997,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 052"
          },
          {
            "id": 699996,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 053"
          },
          {
            "id": 699995,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 054"
          },
          {
            "id": 699994,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 055"
          },
          {
            "id": 699993,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 056"
          },
          {
            "id": 699992,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 057"
          },
          {
            "id": 699991,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 058"
          },
          {
            "id": 699990,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 059"
          },
          {
            "id": 699989,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 060"
          },
          {
            "id": 699988,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 061"
          },
          {
            "id": 699987,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 062"
          },
          {
            "id": 699986,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 063"
          },
          {
            "id": 699985,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 064"
          },
          {
            "id": 699984,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 065"
          },
          {
            "id": 699983,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 066"
          },
          {
            "id": 699982,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 067"
          },
          {
            "id": 699981,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 068"
          },
          {
            "id": 699980,
            "published_at": "2026-09-01 12:00:00",
            "title": "W15 article 069"
          },
          {
            "id": 699979,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 070"
          },
          {
            "id": 699978,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 071"
          },
          {
            "id": 699977,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 072"
          },
          {
            "id": 699976,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 073"
          },
          {
            "id": 699975,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 074"
          },
          {
            "id": 699974,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 075"
          },
          {
            "id": 699973,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 076"
          },
          {
            "id": 699972,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 077"
          },
          {
            "id": 699971,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 078"
          },
          {
            "id": 699970,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 079"
          },
          {
            "id": 699969,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 080"
          },
          {
            "id": 699968,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 081"
          },
          {
            "id": 699967,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 082"
          },
          {
            "id": 699966,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 083"
          },
          {
            "id": 699965,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 084"
          },
          {
            "id": 699964,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 085"
          },
          {
            "id": 699963,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 086"
          },
          {
            "id": 699962,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 087"
          },
          {
            "id": 699961,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 088"
          },
          {
            "id": 699960,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 089"
          },
          {
            "id": 699959,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 090"
          },
          {
            "id": 699958,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 091"
          },
          {
            "id": 699957,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 092"
          },
          {
            "id": 699956,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 093"
          },
          {
            "id": 699955,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 094"
          },
          {
            "id": 699954,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 095"
          },
          {
            "id": 699953,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 096"
          },
          {
            "id": 699952,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 097"
          },
          {
            "id": 699951,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 098"
          },
          {
            "id": 699950,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 099"
          },
          {
            "id": 699949,
            "published_at": "2026-09-01 11:59:00",
            "title": "W15 article 100"
          }
        ],
        "affectedRows": null,
        "connection": "writer"
      }
    ]
  },
  "extra": {
    "cursorBoundary": {
      "firstLast": {
        "id": 700000,
        "published_at": "2026-09-01 12:00:00",
        "title": "W15 article 049"
      },
      "nextResponse50": [
        {
          "id": 699999,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 050"
        },
        {
          "id": 699998,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 051"
        },
        {
          "id": 699997,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 052"
        },
        {
          "id": 699996,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 053"
        },
        {
          "id": 699995,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 054"
        },
        {
          "id": 699994,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 055"
        },
        {
          "id": 699993,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 056"
        },
        {
          "id": 699992,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 057"
        },
        {
          "id": 699991,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 058"
        },
        {
          "id": 699990,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 059"
        },
        {
          "id": 699989,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 060"
        },
        {
          "id": 699988,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 061"
        },
        {
          "id": 699987,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 062"
        },
        {
          "id": 699986,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 063"
        },
        {
          "id": 699985,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 064"
        },
        {
          "id": 699984,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 065"
        },
        {
          "id": 699983,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 066"
        },
        {
          "id": 699982,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 067"
        },
        {
          "id": 699981,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 068"
        },
        {
          "id": 699980,
          "published_at": "2026-09-01 12:00:00",
          "title": "W15 article 069"
        },
        {
          "id": 699979,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 070"
        },
        {
          "id": 699978,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 071"
        },
        {
          "id": 699977,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 072"
        },
        {
          "id": 699976,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 073"
        },
        {
          "id": 699975,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 074"
        },
        {
          "id": 699974,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 075"
        },
        {
          "id": 699973,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 076"
        },
        {
          "id": 699972,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 077"
        },
        {
          "id": 699971,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 078"
        },
        {
          "id": 699970,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 079"
        },
        {
          "id": 699969,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 080"
        },
        {
          "id": 699968,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 081"
        },
        {
          "id": 699967,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 082"
        },
        {
          "id": 699966,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 083"
        },
        {
          "id": 699965,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 084"
        },
        {
          "id": 699964,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 085"
        },
        {
          "id": 699963,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 086"
        },
        {
          "id": 699962,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 087"
        },
        {
          "id": 699961,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 088"
        },
        {
          "id": 699960,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 089"
        },
        {
          "id": 699959,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 090"
        },
        {
          "id": 699958,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 091"
        },
        {
          "id": 699957,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 092"
        },
        {
          "id": 699956,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 093"
        },
        {
          "id": 699955,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 094"
        },
        {
          "id": 699954,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 095"
        },
        {
          "id": 699953,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 096"
        },
        {
          "id": 699952,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 097"
        },
        {
          "id": 699951,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 098"
        },
        {
          "id": 699950,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 099"
        }
      ],
      "peek51": {
        "id": 699949,
        "published_at": "2026-09-01 11:59:00",
        "title": "W15 article 100"
      },
      "correctLastReturnedCursorNext": [
        {
          "id": 699949,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 100"
        },
        {
          "id": 699948,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 101"
        },
        {
          "id": 699947,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 102"
        },
        {
          "id": 699946,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 103"
        },
        {
          "id": 699945,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 104"
        },
        {
          "id": 699944,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 105"
        },
        {
          "id": 699943,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 106"
        },
        {
          "id": 699942,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 107"
        },
        {
          "id": 699941,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 108"
        },
        {
          "id": 699940,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 109"
        },
        {
          "id": 699939,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 110"
        },
        {
          "id": 699938,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 111"
        },
        {
          "id": 699937,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 112"
        },
        {
          "id": 699936,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 113"
        },
        {
          "id": 699935,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 114"
        },
        {
          "id": 699934,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 115"
        },
        {
          "id": 699933,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 116"
        },
        {
          "id": 699932,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 117"
        },
        {
          "id": 699931,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 118"
        },
        {
          "id": 699930,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 119"
        },
        {
          "id": 699929,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 120"
        },
        {
          "id": 699928,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 121"
        },
        {
          "id": 699927,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 122"
        },
        {
          "id": 699926,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 123"
        },
        {
          "id": 699925,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 124"
        },
        {
          "id": 699924,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 125"
        },
        {
          "id": 699923,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 126"
        },
        {
          "id": 699922,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 127"
        },
        {
          "id": 699921,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 128"
        },
        {
          "id": 699920,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 129"
        },
        {
          "id": 699919,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 130"
        },
        {
          "id": 699918,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 131"
        },
        {
          "id": 699917,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 132"
        },
        {
          "id": 699916,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 133"
        },
        {
          "id": 699915,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 134"
        },
        {
          "id": 699914,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 135"
        },
        {
          "id": 699913,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 136"
        },
        {
          "id": 699912,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 137"
        },
        {
          "id": 699911,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 138"
        },
        {
          "id": 699910,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 139"
        },
        {
          "id": 699909,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 140"
        },
        {
          "id": 699908,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 141"
        },
        {
          "id": 699907,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 142"
        },
        {
          "id": 699906,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 143"
        },
        {
          "id": 699905,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 144"
        },
        {
          "id": 699904,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 145"
        },
        {
          "id": 699903,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 146"
        },
        {
          "id": 699902,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 147"
        },
        {
          "id": 699901,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 148"
        },
        {
          "id": 699900,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 149"
        }
      ],
      "wrongPeekCursorNext": [
        {
          "id": 699948,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 101"
        },
        {
          "id": 699947,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 102"
        },
        {
          "id": 699946,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 103"
        },
        {
          "id": 699945,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 104"
        },
        {
          "id": 699944,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 105"
        },
        {
          "id": 699943,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 106"
        },
        {
          "id": 699942,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 107"
        },
        {
          "id": 699941,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 108"
        },
        {
          "id": 699940,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 109"
        },
        {
          "id": 699939,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 110"
        },
        {
          "id": 699938,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 111"
        },
        {
          "id": 699937,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 112"
        },
        {
          "id": 699936,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 113"
        },
        {
          "id": 699935,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 114"
        },
        {
          "id": 699934,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 115"
        },
        {
          "id": 699933,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 116"
        },
        {
          "id": 699932,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 117"
        },
        {
          "id": 699931,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 118"
        },
        {
          "id": 699930,
          "published_at": "2026-09-01 11:59:00",
          "title": "W15 article 119"
        },
        {
          "id": 699929,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 120"
        },
        {
          "id": 699928,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 121"
        },
        {
          "id": 699927,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 122"
        },
        {
          "id": 699926,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 123"
        },
        {
          "id": 699925,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 124"
        },
        {
          "id": 699924,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 125"
        },
        {
          "id": 699923,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 126"
        },
        {
          "id": 699922,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 127"
        },
        {
          "id": 699921,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 128"
        },
        {
          "id": 699920,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 129"
        },
        {
          "id": 699919,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 130"
        },
        {
          "id": 699918,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 131"
        },
        {
          "id": 699917,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 132"
        },
        {
          "id": 699916,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 133"
        },
        {
          "id": 699915,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 134"
        },
        {
          "id": 699914,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 135"
        },
        {
          "id": 699913,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 136"
        },
        {
          "id": 699912,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 137"
        },
        {
          "id": 699911,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 138"
        },
        {
          "id": 699910,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 139"
        },
        {
          "id": 699909,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 140"
        },
        {
          "id": 699908,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 141"
        },
        {
          "id": 699907,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 142"
        },
        {
          "id": 699906,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 143"
        },
        {
          "id": 699905,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 144"
        },
        {
          "id": 699904,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 145"
        },
        {
          "id": 699903,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 146"
        },
        {
          "id": 699902,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 147"
        },
        {
          "id": 699901,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 148"
        },
        {
          "id": 699900,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 149"
        },
        {
          "id": 699899,
          "published_at": "2026-09-01 11:58:00",
          "title": "W15 article 150"
        }
      ],
      "timestampOnlyIds": [
        699979,
        699978,
        699977,
        699976,
        699975,
        699974,
        699973,
        699972,
        699971,
        699970,
        699969,
        699968,
        699967,
        699966,
        699965,
        699964,
        699963,
        699962,
        699961,
        699960,
        699959,
        699958,
        699957,
        699956,
        699955,
        699954,
        699953,
        699952,
        699951,
        699950,
        699949,
        699948,
        699947,
        699946,
        699945,
        699944,
        699943,
        699942,
        699941,
        699940,
        699939,
        699938,
        699937,
        699936,
        699935,
        699934,
        699933,
        699932,
        699931,
        699930
      ]
    },
    "alignedPage": {
      "priorRow449": {
        "id": 699600,
        "published_at": "2026-09-01 11:52:00"
      },
      "rows": [
        {
          "id": 699599,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 450"
        },
        {
          "id": 699598,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 451"
        },
        {
          "id": 699597,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 452"
        },
        {
          "id": 699596,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 453"
        },
        {
          "id": 699595,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 454"
        },
        {
          "id": 699594,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 455"
        },
        {
          "id": 699593,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 456"
        },
        {
          "id": 699592,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 457"
        },
        {
          "id": 699591,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 458"
        },
        {
          "id": 699590,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 459"
        },
        {
          "id": 699589,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 460"
        },
        {
          "id": 699588,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 461"
        },
        {
          "id": 699587,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 462"
        },
        {
          "id": 699586,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 463"
        },
        {
          "id": 699585,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 464"
        },
        {
          "id": 699584,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 465"
        },
        {
          "id": 699583,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 466"
        },
        {
          "id": 699582,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 467"
        },
        {
          "id": 699581,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 468"
        },
        {
          "id": 699580,
          "published_at": "2026-09-01 11:52:00",
          "title": "W15 article 469"
        },
        {
          "id": 699579,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 470"
        },
        {
          "id": 699578,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 471"
        },
        {
          "id": 699577,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 472"
        },
        {
          "id": 699576,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 473"
        },
        {
          "id": 699575,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 474"
        },
        {
          "id": 699574,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 475"
        },
        {
          "id": 699573,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 476"
        },
        {
          "id": 699572,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 477"
        },
        {
          "id": 699571,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 478"
        },
        {
          "id": 699570,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 479"
        },
        {
          "id": 699569,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 480"
        },
        {
          "id": 699568,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 481"
        },
        {
          "id": 699567,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 482"
        },
        {
          "id": 699566,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 483"
        },
        {
          "id": 699565,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 484"
        },
        {
          "id": 699564,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 485"
        },
        {
          "id": 699563,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 486"
        },
        {
          "id": 699562,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 487"
        },
        {
          "id": 699561,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 488"
        },
        {
          "id": 699560,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 489"
        },
        {
          "id": 699559,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 490"
        },
        {
          "id": 699558,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 491"
        },
        {
          "id": 699557,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 492"
        },
        {
          "id": 699556,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 493"
        },
        {
          "id": 699555,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 494"
        },
        {
          "id": 699554,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 495"
        },
        {
          "id": 699553,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 496"
        },
        {
          "id": 699552,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 497"
        },
        {
          "id": 699551,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 498"
        },
        {
          "id": 699550,
          "published_at": "2026-09-01 11:51:00",
          "title": "W15 article 499"
        }
      ]
    },
    "insertAtFront": {
      "firstPage": [
        5,
        4,
        3
      ],
      "offset": [
        3,
        2,
        1
      ],
      "keyset": [
        2,
        1
      ]
    },
    "deletePrior": {
      "offset": [
        1
      ],
      "keyset": [
        2,
        1
      ]
    },
    "backdatedInsert": {
      "keyset": [
        2,
        6,
        1
      ],
      "idOnly": [
        2,
        1
      ]
    },
    "mutableSortKeys": {
      "unseenMovedBeforeBoundary": [
        1
      ],
      "seenMovedAfterBoundary": [
        2,
        4,
        1
      ]
    },
    "explicitSnapshot": {
      "first": [
        5,
        4,
        3
      ],
      "sameTransactionOffsetNext": [
        2,
        1
      ],
      "afterCommitFreshOffsetNext": [
        3,
        2,
        1
      ]
    },
    "mixedSort": {
      "first": [
        {
          "id": 699980,
          "published_at": "2026-09-01 12:00:00"
        },
        {
          "id": 699981,
          "published_at": "2026-09-01 12:00:00"
        },
        {
          "id": 699982,
          "published_at": "2026-09-01 12:00:00"
        }
      ],
      "correctNext": [
        699983,
        699984,
        699985
      ],
      "wrongLessNext": [
        699980,
        699981,
        699930
      ]
    },
    "nullable": {
      "fullOrder": [
        {
          "id": 3,
          "published_at": "2026-09-01 12:00:00"
        },
        {
          "id": 2,
          "published_at": "2026-09-01 11:00:00"
        },
        {
          "id": 1,
          "published_at": null
        }
      ],
      "plainInequalityAfter11": [],
      "scope": "separate nullable SQL fixture; original added Article mapping remains NOT NULL; no null JPA keyset execution"
    }
  },
  "java": {
    "versions": {
      "mysql": "8.4.11",
      "java": 21,
      "driver": "mysql-connector-j-9.7.0 (Revision: 0aade1f13bcc98faf7dda5c02e782481eb291f62)",
      "hibernate": "7.4.5.Final",
      "springDataJpa": "4.1.1",
      "springDataCommons": "4.1.1"
    },
    "originalCalls": [
      {
        "method": "findByStatus",
        "status": "PUBLISHED",
        "kind": "Page",
        "ids": [
          700049,
          700048,
          700047,
          700046,
          700045,
          700044,
          700043,
          700042,
          700041,
          700040,
          700039,
          700038,
          700037,
          700036,
          700035,
          700034,
          700033,
          700032,
          700031,
          700030,
          700029,
          700028,
          700027,
          700026,
          700025,
          700024,
          700023,
          700022,
          700021,
          700020,
          700019,
          700018,
          700017,
          700016,
          700015,
          700014,
          700013,
          700012,
          700011,
          700010,
          700009,
          700008,
          700007,
          700006,
          700005,
          700004,
          700003,
          700002,
          700001,
          700000
        ],
        "total": 600,
        "hasNext": true,
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setInt",
                "value": 50
              }
            },
            "resultRows": 50,
            "statementClosed": true,
            "resultClosed": true
          },
          {
            "sql": "select count(a1_0.id) from article a1_0 where a1_0.status=?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              }
            },
            "resultRows": 1,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findSliceByStatus",
        "status": "PUBLISHED",
        "kind": "Slice",
        "ids": [
          700049,
          700048,
          700047,
          700046,
          700045,
          700044,
          700043,
          700042,
          700041,
          700040,
          700039,
          700038,
          700037,
          700036,
          700035,
          700034,
          700033,
          700032,
          700031,
          700030,
          700029,
          700028,
          700027,
          700026,
          700025,
          700024,
          700023,
          700022,
          700021,
          700020,
          700019,
          700018,
          700017,
          700016,
          700015,
          700014,
          700013,
          700012,
          700011,
          700010,
          700009,
          700008,
          700007,
          700006,
          700005,
          700004,
          700003,
          700002,
          700001,
          700000
        ],
        "hasNext": true,
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": true,
          "keys": {}
        },
        "kind": "Window",
        "ids": [
          700049,
          700048,
          700047,
          700046,
          700045,
          700044,
          700043,
          700042,
          700041,
          700040,
          700039,
          700038,
          700037,
          700036,
          700035,
          700034,
          700033,
          700032,
          700031,
          700030,
          700029,
          700028,
          700027,
          700026,
          700025,
          700024,
          700023,
          700022,
          700021,
          700020,
          700019,
          700018,
          700017,
          700016,
          700015,
          700014,
          700013,
          700012,
          700011,
          700010,
          700009,
          700008,
          700007,
          700006,
          700005,
          700004,
          700003,
          700002,
          700001,
          700000
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 700000,
            "publishedAt": "2026-09-01T12:00"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 700000,
            "publishedAt": "2026-09-01T12:00"
          }
        },
        "kind": "Window",
        "ids": [
          699999,
          699998,
          699997,
          699996,
          699995,
          699994,
          699993,
          699992,
          699991,
          699990,
          699989,
          699988,
          699987,
          699986,
          699985,
          699984,
          699983,
          699982,
          699981,
          699980,
          699979,
          699978,
          699977,
          699976,
          699975,
          699974,
          699973,
          699972,
          699971,
          699970,
          699969,
          699968,
          699967,
          699966,
          699965,
          699964,
          699963,
          699962,
          699961,
          699960,
          699959,
          699958,
          699957,
          699956,
          699955,
          699954,
          699953,
          699952,
          699951,
          699950
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699950,
            "publishedAt": "2026-09-01T11:59"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 12:00:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 12:00:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 700000
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699950,
            "publishedAt": "2026-09-01T11:59"
          }
        },
        "kind": "Window",
        "ids": [
          699949,
          699948,
          699947,
          699946,
          699945,
          699944,
          699943,
          699942,
          699941,
          699940,
          699939,
          699938,
          699937,
          699936,
          699935,
          699934,
          699933,
          699932,
          699931,
          699930,
          699929,
          699928,
          699927,
          699926,
          699925,
          699924,
          699923,
          699922,
          699921,
          699920,
          699919,
          699918,
          699917,
          699916,
          699915,
          699914,
          699913,
          699912,
          699911,
          699910,
          699909,
          699908,
          699907,
          699906,
          699905,
          699904,
          699903,
          699902,
          699901,
          699900
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699900,
            "publishedAt": "2026-09-01T11:58"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:59:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:59:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699950
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699900,
            "publishedAt": "2026-09-01T11:58"
          }
        },
        "kind": "Window",
        "ids": [
          699899,
          699898,
          699897,
          699896,
          699895,
          699894,
          699893,
          699892,
          699891,
          699890,
          699889,
          699888,
          699887,
          699886,
          699885,
          699884,
          699883,
          699882,
          699881,
          699880,
          699879,
          699878,
          699877,
          699876,
          699875,
          699874,
          699873,
          699872,
          699871,
          699870,
          699869,
          699868,
          699867,
          699866,
          699865,
          699864,
          699863,
          699862,
          699861,
          699860,
          699859,
          699858,
          699857,
          699856,
          699855,
          699854,
          699853,
          699852,
          699851,
          699850
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699850,
            "publishedAt": "2026-09-01T11:57"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:58:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:58:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699900
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699850,
            "publishedAt": "2026-09-01T11:57"
          }
        },
        "kind": "Window",
        "ids": [
          699849,
          699848,
          699847,
          699846,
          699845,
          699844,
          699843,
          699842,
          699841,
          699840,
          699839,
          699838,
          699837,
          699836,
          699835,
          699834,
          699833,
          699832,
          699831,
          699830,
          699829,
          699828,
          699827,
          699826,
          699825,
          699824,
          699823,
          699822,
          699821,
          699820,
          699819,
          699818,
          699817,
          699816,
          699815,
          699814,
          699813,
          699812,
          699811,
          699810,
          699809,
          699808,
          699807,
          699806,
          699805,
          699804,
          699803,
          699802,
          699801,
          699800
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699800,
            "publishedAt": "2026-09-01T11:56"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:57:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:57:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699850
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699800,
            "publishedAt": "2026-09-01T11:56"
          }
        },
        "kind": "Window",
        "ids": [
          699799,
          699798,
          699797,
          699796,
          699795,
          699794,
          699793,
          699792,
          699791,
          699790,
          699789,
          699788,
          699787,
          699786,
          699785,
          699784,
          699783,
          699782,
          699781,
          699780,
          699779,
          699778,
          699777,
          699776,
          699775,
          699774,
          699773,
          699772,
          699771,
          699770,
          699769,
          699768,
          699767,
          699766,
          699765,
          699764,
          699763,
          699762,
          699761,
          699760,
          699759,
          699758,
          699757,
          699756,
          699755,
          699754,
          699753,
          699752,
          699751,
          699750
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699750,
            "publishedAt": "2026-09-01T11:55"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:56:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:56:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699800
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699750,
            "publishedAt": "2026-09-01T11:55"
          }
        },
        "kind": "Window",
        "ids": [
          699749,
          699748,
          699747,
          699746,
          699745,
          699744,
          699743,
          699742,
          699741,
          699740,
          699739,
          699738,
          699737,
          699736,
          699735,
          699734,
          699733,
          699732,
          699731,
          699730,
          699729,
          699728,
          699727,
          699726,
          699725,
          699724,
          699723,
          699722,
          699721,
          699720,
          699719,
          699718,
          699717,
          699716,
          699715,
          699714,
          699713,
          699712,
          699711,
          699710,
          699709,
          699708,
          699707,
          699706,
          699705,
          699704,
          699703,
          699702,
          699701,
          699700
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699700,
            "publishedAt": "2026-09-01T11:54"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:55:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:55:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699750
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699700,
            "publishedAt": "2026-09-01T11:54"
          }
        },
        "kind": "Window",
        "ids": [
          699699,
          699698,
          699697,
          699696,
          699695,
          699694,
          699693,
          699692,
          699691,
          699690,
          699689,
          699688,
          699687,
          699686,
          699685,
          699684,
          699683,
          699682,
          699681,
          699680,
          699679,
          699678,
          699677,
          699676,
          699675,
          699674,
          699673,
          699672,
          699671,
          699670,
          699669,
          699668,
          699667,
          699666,
          699665,
          699664,
          699663,
          699662,
          699661,
          699660,
          699659,
          699658,
          699657,
          699656,
          699655,
          699654,
          699653,
          699652,
          699651,
          699650
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699650,
            "publishedAt": "2026-09-01T11:53"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:54:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:54:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699700
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699650,
            "publishedAt": "2026-09-01T11:53"
          }
        },
        "kind": "Window",
        "ids": [
          699649,
          699648,
          699647,
          699646,
          699645,
          699644,
          699643,
          699642,
          699641,
          699640,
          699639,
          699638,
          699637,
          699636,
          699635,
          699634,
          699633,
          699632,
          699631,
          699630,
          699629,
          699628,
          699627,
          699626,
          699625,
          699624,
          699623,
          699622,
          699621,
          699620,
          699619,
          699618,
          699617,
          699616,
          699615,
          699614,
          699613,
          699612,
          699611,
          699610,
          699609,
          699608,
          699607,
          699606,
          699605,
          699604,
          699603,
          699602,
          699601,
          699600
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699600,
            "publishedAt": "2026-09-01T11:52"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:53:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:53:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699650
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699600,
            "publishedAt": "2026-09-01T11:52"
          }
        },
        "kind": "Window",
        "ids": [
          699599,
          699598,
          699597,
          699596,
          699595,
          699594,
          699593,
          699592,
          699591,
          699590,
          699589,
          699588,
          699587,
          699586,
          699585,
          699584,
          699583,
          699582,
          699581,
          699580,
          699579,
          699578,
          699577,
          699576,
          699575,
          699574,
          699573,
          699572,
          699571,
          699570,
          699569,
          699568,
          699567,
          699566,
          699565,
          699564,
          699563,
          699562,
          699561,
          699560,
          699559,
          699558,
          699557,
          699556,
          699555,
          699554,
          699553,
          699552,
          699551,
          699550
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699550,
            "publishedAt": "2026-09-01T11:51"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:52:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:52:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699600
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699550,
            "publishedAt": "2026-09-01T11:51"
          }
        },
        "kind": "Window",
        "ids": [
          699549,
          699548,
          699547,
          699546,
          699545,
          699544,
          699543,
          699542,
          699541,
          699540,
          699539,
          699538,
          699537,
          699536,
          699535,
          699534,
          699533,
          699532,
          699531,
          699530,
          699529,
          699528,
          699527,
          699526,
          699525,
          699524,
          699523,
          699522,
          699521,
          699520,
          699519,
          699518,
          699517,
          699516,
          699515,
          699514,
          699513,
          699512,
          699511,
          699510,
          699509,
          699508,
          699507,
          699506,
          699505,
          699504,
          699503,
          699502,
          699501,
          699500
        ],
        "hasNext": true,
        "last": false,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699500,
            "publishedAt": "2026-09-01T11:50"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:51:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:51:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699550
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 51,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      },
      {
        "method": "findFirst50ByStatusOrderByPublishedAtDescIdDesc",
        "status": "PUBLISHED",
        "inputPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699500,
            "publishedAt": "2026-09-01T11:50"
          }
        },
        "kind": "Window",
        "ids": [
          699499,
          699498,
          699497,
          699496,
          699495,
          699494,
          699493,
          699492,
          699491,
          699490,
          699489,
          699488,
          699487,
          699486,
          699485,
          699484,
          699483,
          699482,
          699481,
          699480,
          699479,
          699478,
          699477,
          699476,
          699475,
          699474,
          699473,
          699472,
          699471,
          699470,
          699469,
          699468,
          699467,
          699466,
          699465,
          699464,
          699463,
          699462,
          699461,
          699460,
          699459,
          699458,
          699457,
          699456,
          699455,
          699454,
          699453,
          699452,
          699451,
          699450
        ],
        "hasNext": false,
        "last": true,
        "lastReturnedPosition": {
          "kind": "keyset",
          "initial": false,
          "keys": {
            "id": 699450,
            "publishedAt": "2026-09-01T11:49"
          }
        },
        "queries": [
          {
            "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where (a1_0.status=?) and (a1_0.published_at<? or a1_0.published_at=? and a1_0.id<?) order by a1_0.published_at desc,a1_0.id desc limit ?",
            "bindings": {
              "1": {
                "method": "setString",
                "value": "PUBLISHED"
              },
              "2": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:50:00.0"
              },
              "3": {
                "method": "setTimestamp",
                "value": "2026-09-01 11:50:00.0"
              },
              "4": {
                "method": "setLong",
                "value": 699500
              },
              "5": {
                "method": "setInt",
                "value": 51
              }
            },
            "resultRows": 50,
            "statementClosed": true,
            "resultClosed": true
          }
        ]
      }
    ],
    "extraPartialPage": {
      "ids": [
        1000037,
        1000036,
        1000035,
        1000034,
        1000033,
        1000032,
        1000031,
        1000030,
        1000029,
        1000028,
        1000027,
        1000026,
        1000025,
        1000024,
        1000023,
        1000022,
        1000021,
        1000020,
        1000019,
        1000018,
        1000017,
        1000016,
        1000015,
        1000014,
        1000013,
        1000012,
        1000011,
        1000010,
        1000009,
        1000008,
        1000007,
        1000006,
        1000005,
        1000004,
        1000003,
        1000002,
        1000001
      ],
      "total": 37,
      "queries": [
        {
          "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?",
          "bindings": {
            "1": {
              "method": "setString",
              "value": "DRAFT"
            },
            "2": {
              "method": "setInt",
              "value": 50
            }
          },
          "resultRows": 37,
          "statementClosed": true,
          "resultClosed": true
        }
      ]
    },
    "extraOffsetWindows": {
      "initial": {
        "position": {
          "kind": "offset",
          "initial": true
        },
        "ids": [
          700049,
          700048,
          700047,
          700046,
          700045,
          700044,
          700043,
          700042,
          700041,
          700040,
          700039,
          700038,
          700037,
          700036,
          700035,
          700034,
          700033,
          700032,
          700031,
          700030,
          700029,
          700028,
          700027,
          700026,
          700025,
          700024,
          700023,
          700022,
          700021,
          700020,
          700019,
          700018,
          700017,
          700016,
          700015,
          700014,
          700013,
          700012,
          700011,
          700010,
          700009,
          700008,
          700007,
          700006,
          700005,
          700004,
          700003,
          700002,
          700001,
          700000
        ],
        "lastReturnedPosition": {
          "kind": "offset",
          "initial": false,
          "offset": 49
        }
      },
      "offsetZero": {
        "position": {
          "kind": "offset",
          "initial": false,
          "offset": 0
        },
        "ids": [
          700048,
          700047,
          700046,
          700045,
          700044,
          700043,
          700042,
          700041,
          700040,
          700039,
          700038,
          700037,
          700036,
          700035,
          700034,
          700033,
          700032,
          700031,
          700030,
          700029,
          700028,
          700027,
          700026,
          700025,
          700024,
          700023,
          700022,
          700021,
          700020,
          700019,
          700018,
          700017,
          700016,
          700015,
          700014,
          700013,
          700012,
          700011,
          700010,
          700009,
          700008,
          700007,
          700006,
          700005,
          700004,
          700003,
          700002,
          700001,
          700000,
          699999
        ]
      },
      "next": {
        "inputPosition": {
          "kind": "offset",
          "initial": false,
          "offset": 49
        },
        "ids": [
          699999,
          699998,
          699997,
          699996,
          699995,
          699994,
          699993,
          699992,
          699991,
          699990,
          699989,
          699988,
          699987,
          699986,
          699985,
          699984,
          699983,
          699982,
          699981,
          699980,
          699979,
          699978,
          699977,
          699976,
          699975,
          699974,
          699973,
          699972,
          699971,
          699970,
          699969,
          699968,
          699967,
          699966,
          699965,
          699964,
          699963,
          699962,
          699961,
          699960,
          699959,
          699958,
          699957,
          699956,
          699955,
          699954,
          699953,
          699952,
          699951,
          699950
        ]
      },
      "queries": [
        {
          "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?",
          "bindings": {
            "1": {
              "method": "setString",
              "value": "PUBLISHED"
            },
            "2": {
              "method": "setInt",
              "value": 51
            }
          },
          "resultRows": 51,
          "statementClosed": true,
          "resultClosed": true
        },
        {
          "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?,?",
          "bindings": {
            "1": {
              "method": "setString",
              "value": "PUBLISHED"
            },
            "2": {
              "method": "setInt",
              "value": 1
            },
            "3": {
              "method": "setInt",
              "value": 51
            }
          },
          "resultRows": 51,
          "statementClosed": true,
          "resultClosed": true
        },
        {
          "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id desc limit ?,?",
          "bindings": {
            "1": {
              "method": "setString",
              "value": "PUBLISHED"
            },
            "2": {
              "method": "setInt",
              "value": 50
            },
            "3": {
              "method": "setInt",
              "value": 51
            }
          },
          "resultRows": 51,
          "statementClosed": true,
          "resultClosed": true
        }
      ]
    },
    "extraPrimaryKeyAugmentation": {
      "ids": [
        699980,
        699981,
        699982
      ],
      "lastPosition": {
        "kind": "keyset",
        "initial": false,
        "keys": {
          "id": 699982,
          "publishedAt": "2026-09-01T12:00"
        }
      },
      "queries": [
        {
          "sql": "select a1_0.id,a1_0.published_at,a1_0.status,a1_0.title from article a1_0 where a1_0.status=? order by a1_0.published_at desc,a1_0.id limit ?",
          "bindings": {
            "1": {
              "method": "setString",
              "value": "PUBLISHED"
            },
            "2": {
              "method": "setInt",
              "value": 4
            }
          },
          "resultRows": 4,
          "statementClosed": true,
          "resultClosed": true
        }
      ]
    },
    "extraToken": {
      "payload": "v=1&status=PUBLISHED&sort=publishedAt:DESC,id:DESC&id=700000&publishedAt=2026-09-01T12:00",
      "base64": "dj0xJnN0YXR1cz1QVUJMSVNIRUQmc29ydD1wdWJsaXNoZWRBdDpERVNDLGlkOkRFU0MmaWQ9NzAwMDAwJnB1Ymxpc2hlZEF0PTIwMjYtMDktMDFUMTI6MDA",
      "tamperedBase64": "dj0xJnN0YXR1cz1QVUJMSVNIRUQmc29ydD1wdWJsaXNoZWRBdDpERVNDLGlkOkRFU0MmaWQ9NzAwMDAxJnB1Ymxpc2hlZEF0PTIwMjYtMDktMDFUMTI6MDA",
      "signatureHex": "6c3542da4f85af02da592fe2999fb99ba617bcbea0fa061c5f7efa7d562e2c3b",
      "algorithm": "HmacSHA256",
      "key": "public fixture string in helper; no production secret",
      "scope": "manual payload/contract illustration; not source JSON API, no authorization or HTTP implementation"
    },
    "scope": "original repository and compare unchanged; added Article mapping + standalone JPA factory + observing proxy. Original consume body has no implementation. No Boot app/HTTP/DTO/Java25 execution.",
    "checks": [
      "jdbc-only-fresh-guarded-datadir",
      "jdbc-native-mysql8.4.11-loopback",
      "source-page-total600-content50",
      "source-page-first-full-requires-count",
      "source-slice50-has-next-one-query",
      "source-keyset12windows600unique",
      "source-keyset-order-full-tuple",
      "source-fifteen-sql-statements",
      "source-slice-peeks51-returns50",
      "source-window-peeks51-except-final50",
      "source-statements-and-resultsets-closed",
      "source-last-window-ends-loop",
      "source-last-returned-position700000",
      "source-subsequent-keyset-sql-has-boundary",
      "extra-short-first-page37-elides-count",
      "extra-window-offset-is-not-keyset",
      "extra-offset-position-exclusive49-then50",
      "extra-missing-pk-appends-ascending-id",
      "extra-keyset-appends-missing-primary-key",
      "extra-base64-tamper-still-decodes",
      "extra-hmac-tamper-fails",
      "extra-signed-payload-matching-contract-accepted",
      "extra-valid-signature-wrong-filter-rejected",
      "extra-valid-signature-wrong-sort-rejected",
      "extra-valid-signature-wrong-version-rejected"
    ]
  },
  "plans": {
    "sourceFirst": {
      "sql": "SELECT id, published_at, title\nFROM article\nWHERE status = 'PUBLISHED'\nORDER BY published_at DESC, id DESC\nLIMIT 50 OFFSET 0",
      "parameters": null,
      "actualOperatorsRowsLoops": "-> Limit: 50 row(s)  (cost=72.7 rows=50) (actual rows=50 loops=1)\n    -> Covering index lookup on article using idx_feed (status='PUBLISHED')  (cost=72.7 rows=600) (actual rows=50 loops=1)\n",
      "timing": "per-run raw plan in private runtime; no fixed time or ratio claim"
    },
    "sourceDeepOffset": {
      "sql": "SELECT id, published_at, title\nFROM article\nWHERE status = 'PUBLISHED'\nORDER BY published_at DESC, id DESC\nLIMIT 50 OFFSET 450",
      "parameters": null,
      "actualOperatorsRowsLoops": "-> Limit/Offset: 50/450 row(s)  (cost=72.7 rows=50) (actual rows=50 loops=1)\n    -> Covering index lookup on article using idx_feed (status='PUBLISHED')  (cost=72.7 rows=600) (actual rows=500 loops=1)\n",
      "timing": "per-run raw plan in private runtime; no fixed time or ratio claim"
    },
    "sourceLiteralCursor": {
      "sql": "SELECT id, published_at, title\nFROM article\nWHERE status = 'PUBLISHED'\n  AND (published_at < TIMESTAMP '2026-09-01 12:00:00'\n       OR (published_at = TIMESTAMP '2026-09-01 12:00:00' AND id < 700000))\nORDER BY published_at DESC, id DESC\nLIMIT 51",
      "parameters": null,
      "actualOperatorsRowsLoops": "-> Limit: 51 row(s)  (cost=122 rows=51) (actual rows=51 loops=1)\n    -> Filter: ((article.`status` = 'PUBLISHED') and ((article.published_at < TIMESTAMP'2026-09-01 12:00:00') or ((article.published_at = TIMESTAMP'2026-09-01 12:00:00') and (article.id < 700000))))  (cost=122 rows=550) (actual rows=51 loops=1)\n        -> Covering index range scan on article using idx_feed over (status = 'PUBLISHED' AND published_at = '2026-09-01 12:00:00.000000' AND 700000 < id) OR (status = 'PUBLISHED' AND '2026-09-01 12:00:00.000000' < published_at)  (cost=122 rows=550) (actual rows=51 loops=1)\n",
      "timing": "per-run raw plan in private runtime; no fixed time or ratio claim"
    },
    "extraAlignedSeek": {
      "sql": "SELECT id,published_at,title FROM article WHERE status='PUBLISHED'AND(published_at<%s OR(published_at=%s AND id<%s))ORDER BY published_at DESC,id DESC LIMIT 50",
      "parameters": [
        "2026-09-01 11:52:00",
        "2026-09-01 11:52:00",
        699600
      ],
      "actualOperatorsRowsLoops": "-> Limit: 50 row(s)  (cost=33.4 rows=50) (actual rows=50 loops=1)\n    -> Filter: ((article.`status` = 'PUBLISHED') and ((article.published_at < TIMESTAMP'2026-09-01 11:52:00') or ((article.published_at = TIMESTAMP'2026-09-01 11:52:00') and (article.id < 699600))))  (cost=33.4 rows=150) (actual rows=50 loops=1)\n        -> Covering index range scan on article using idx_feed over (status = 'PUBLISHED' AND published_at = '2026-09-01 11:52:00.000000' AND 699600 < id) OR (status = 'PUBLISHED' AND '2026-09-01 11:52:00.000000' < published_at)  (cost=33.4 rows=150) (actual rows=50 loops=1)\n",
      "timing": "per-run raw plan in private runtime; no fixed time or ratio claim"
    }
  },
  "checks": [
    "private-native-mysql8.4.11",
    "source-first50-last700000",
    "source-offset450-is-row450-through499",
    "source-cursor51-from699999-through699949",
    "source-offset450-and-literal-cursor-different-pages",
    "extra-timestamp-only-skips20-tied-rows",
    "extra-cursor-last-returned-not-peek",
    "extra-aligned-keyset-equals-offset450",
    "extra-plan-deep500-vs-aligned-seek50",
    "extra-controlled-first-page543",
    "extra-front-insert-offset-repeats3-keyset21",
    "extra-prior-delete-offset-skips2-keyset21",
    "extra-backdated-insert-changes-later-results",
    "extra-mutable-key-can-miss-and-repeat",
    "extra-one-rr-snapshot-vs-fresh-read",
    "extra-desc-asc-requires-id-greater",
    "extra-null-tail-not-returned-by-plain-inequality",
    "java-all-recorded-checks-pass"
  ]
};

export const w15Run=path=>path.split('.').reduce((object,key)=>object?.[key],W15_RUNS);
const stage=(topic,id,title,lead,code,values,checks=[],runKeys=[],extra={})=>({id:topic+'-'+id,title,lead,code,values,checks,runKeys,active:[0],image:'W15-'+(topic==='spring'?'page':topic),...extra});
const sql=path=>w15Run(path).sql+';';
const scope='원문·추가 실행 관찰';
const limits='원문 Java25·Boot 앱·HTTP·DTO·서비스 인증은 미실행입니다. 원문 consume은 빈 본문이며 실제 업무 처리를 구현하지 않았습니다.';
const fixtureNote='추가 Article 데이터는 PUBLISHED600·DRAFT37이며 첫70행은12:00 동률입니다. idx_feed를 사용한 이 실험의 값입니다.';
const timelineSeek="SELECT id,published_at FROM w15_demo.timeline WHERE published_at<'2026-09-01 13:00:00' OR(published_at='2026-09-01 13:00:00'AND id<3) ORDER BY published_at DESC,id DESC LIMIT 3;";
export const W15_LESSONS=[
{id:'offset',question:'OFFSET450과 원문 커서는 같은 페이지일까?',source:scope+' · 원문 SQL3개 / 추가 동일 페이지 seek',sourceNote:fixtureNote,note:'원문의 literal cursor는 첫 응답의 마지막700000/12:00 경계입니다. OFFSET450의 직전 row449 경계와 다릅니다. iterator 행 수와 JDBC 반환 행 수, 시간·I/O를 구분합니다. '+limits,stages:[
 stage('offset','first','원문 첫50행의 마지막700000','원문 OFFSET0은700049부터700000까지50행을 반환했습니다. 마지막 행의 시각은12:00이며 같은 시각의 PUBLISHED70행 중 아직20행이 뒤에 남습니다.',sql('source.sql.0'),[['추가 seed','PUBLISHED600 / DRAFT37'],['첫 결과 id 범위','700049 → 700000 · 50행'],['마지막 정렬 키','2026-09-01 12:00:00 / id700000'],['같은 시각 전체 동률','70행']],['private-native-mysql8.4.11','source-first50-last700000'],['runtime','fixture','source.sql.0']),
 stage('offset','deep','원문 OFFSET450은699599부터','원문의 OFFSET450은 row450~499인699599..699550입니다. 원문 literal cursor는699999..699949의51행이므로 같은 페이지 비교가 아닙니다.',sql('source.sql.1'),[['OFFSET450 결과','699599 → 699550 · 50행'],['원문 literal cursor 결과','699999 → 699949 · 51행'],['경계 차이','OFFSET450 ≠ 첫 응답700000 커서의 다음 범위']],['source-offset450-is-row450-through499','source-offset450-and-literal-cursor-different-pages'],['source.sql.1','source.sql.2']),
 stage('offset','aligned','추가 row449 경계로 같은50행','추가 조회는 직전 row449에서699600·11:52를 얻어 seek 조건에 바인딩했습니다. 그 LIMIT50 결과는 원문 OFFSET450의50행과 정확히 같습니다.',sql('plans.extraAlignedSeek'),[['추가 이전 행','offset449 / id699600 / 2026-09-01 11:52:00'],['seek 바인딩','11:52 / 11:52 / 699600'],['동일한 결과','699599 → 699550 · 50행'],['비교 기준','같은 필터·정렬·페이지 경계']],['extra-aligned-keyset-equals-offset450'],['extra.alignedPage','plans.extraAlignedSeek']),
 stage('offset','plan','index iterator500과50을 구분','같은50행을 반환하는 두 쿼리의 실제 계획을 기록했습니다. OFFSET의 covering index lookup actual rows는500, 정렬 경계를 맞춘 seek의 range scan은50입니다. 시간 배수나 물리 I/O가 아닙니다.', 'EXPLAIN ANALYZE '+W15_RUNS.source.sql[1].sql+';\n-- 별도 동일 경계 seek의 실제 계획도 비교',[['공통 반환 행 수','50'],['OFFSET index iterator actual rows','500 · loops1'],['aligned seek iterator actual rows','50 · loops1'],['관측 인덱스','idx_feed covering'],['측정하지 않은 결론','고정 시간 배수·물리 I/O·일반 성능 보장']],['extra-plan-deep500-vs-aligned-seek50'],['plans.sourceDeepOffset','plans.extraAlignedSeek']),
]},
{id:'boundary',question:'커서에는 어느 시각과 id를 담아야 할까?',source:scope+' · 원문 literal SQL / 추가 경계 probe',sourceNote:'원문 cursor SQL은 published_at DESC,id DESC의 완전한 경계와 LIMIT51입니다. 실제 응답·HTTP 토큰 구현은 아닙니다.',note:'아래50개 응답/peek 나누기는 추가 관찰입니다. 원문 SQL 반환51행을 실제 서비스 DTO 응답51개라고 표시하지 않습니다. '+limits,stages:[
 stage('boundary','tuple','같은 시각은id까지 비교','원문 경계700000/12:00 아래를 날짜< 또는 같은 날짜+id<로 읽었습니다. 실제 첫 다음 행은699999이고51번째는699949였습니다.',sql('source.sql.2'),[['경계 키','12:00:00 / 700000'],['정렬·비교','published_at DESC,id DESC / < 와 <'],['SQL 결과','699999 → 699949 · 51행']],['source-cursor51-from699999-through699949'],['source.sql.2','extra.cursorBoundary.firstLast']),
 stage('boundary','timestamp','시각만 비교하면 동률20개 누락','추가 timestamp-only 조건은 published_at<12:00만 검사했습니다.699979부터 시작해 원래 완전한 경계의699999..699980 동률20행을 건너뛰었습니다.',"SELECT id FROM article WHERE status='PUBLISHED'AND published_at<TIMESTAMP '2026-09-01 12:00:00' ORDER BY published_at DESC,id DESC LIMIT 50;",[['완전한 경계 첫 다음 id','699999'],['timestamp-only 첫 id','699979'],['누락된 같은 시각 범위','699999..699980 · 20행']],['extra-timestamp-only-skips20-tied-rows'],['extra.cursorBoundary.timestampOnlyIds','source.sql.2']),
 stage('boundary','peek','다음 커서는 반환한50번째에서','추가 응답50개의 끝은699950이며 여분51번째699949는 hasNext 확인용입니다.699950을 경계로 쓰면 다음 첫행699949, peek를 쓰면699948부터라699949를 건너뜁니다.',"nextq = \"SELECT id,published_at,title FROM article WHERE status='PUBLISHED'AND(published_at<%s OR(published_at=%s AND id<%s))ORDER BY published_at DESC,id DESC LIMIT 50\"\n# 추가 probe는 last=response[-1]의 키와 peek[-1] 키를 각각 바인딩",[['응답50번째 id','699950'],['여분51번째 id','699949'],['올바른 다음 첫 id','699949'],['잘못된 peek 커서의 다음 첫 id','699948']],['extra-cursor-last-returned-not-peek'],['extra.cursorBoundary.nextResponse50','extra.cursorBoundary.peek51','extra.cursorBoundary.correctLastReturnedCursorNext','extra.cursorBoundary.wrongPeekCursorNext']),
]},
{id:'spring',question:'Page·Slice는 실제로 몇 SQL과 행을 읽었을까?',source:scope+' · 원문 ArticlePagingExample 첫 Page/Slice / 추가 DRAFT',sourceNote:'원문 두 Java 파일은 수정하지 않았고 추가 Article·standalone JpaRepositoryFactory·관찰 wrapper로 실행했습니다. Java 결과와 JDBC ResultSet.next 행 수를 구분합니다.',note:'COUNT 결과1행은 total600을 담은 스칼라 행입니다. 결과600개를 JDBC로 읽었다는 뜻이 아닙니다. Page가 언제나 COUNT SQL을 실행한다고 일반화하지 않습니다. '+limits,stages:[
 stage('spring','page','꽉 찬 Page50은COUNT 포함2SQL','원문 PUBLISHED Page는 내용50·total600·hasNext=true였습니다. 내용 SQL ResultSet50행과 별도 COUNT ResultSet1행으로 총2문장을 실행했습니다.','Page<Article> numbered = repository.findByStatus("PUBLISHED", pageable);\nlong total = numbered.getTotalElements();',[['Page content / total','50 / 600'],['hasNext','true'],['SQL 문장 수','2 · 내용 SELECT + COUNT'],['JDBC ResultSet 행 수','내용50 / count 스칼라1']],['jdbc-only-fresh-guarded-datadir','jdbc-native-mysql8.4.11-loopback','source-page-total600-content50','source-page-first-full-requires-count','java-all-recorded-checks-pass'],['java.originalCalls.0','java.versions'],{active:[0,1]}),
 stage('spring','slice','Slice는51을 읽고50 반환','원문 Slice는 LIMIT51의 ResultSet을 읽고 content50·hasNext=true를 반환했습니다. COUNT는 없고 SQL은1문장이었습니다.','Slice<Article> chunk = repository.findSliceByStatus("PUBLISHED", pageable);\nboolean hasMoreOffset = chunk.hasNext();',[['Slice content','50'],['hasNext','true'],['실제 JDBC ResultSet 행 수','51'],['SQL 문장 수','1 · COUNT 없음']],['source-slice50-has-next-one-query','source-slice-peeks51-returns50'],['java.originalCalls.1'],{active:[0,1]}),
 stage('spring','partial','추가 DRAFT37은COUNT 생략','추가 DRAFT 첫 Page는 크기50보다 작은37행입니다. 이 경우 total37을 얻으면서도 COUNT를 생략해 SQL1문장만 실행했습니다.','Page<Article> draft = original.findByStatus("DRAFT", PageRequest.of(0,50,order));',[['추가 status 입력','DRAFT · 원문 compare의 PUBLISHED와 별개'],['content / total','37 / 37'],['SQL / JDBC ResultSet 행 수','1 / 37 · COUNT 없음']],['extra-short-first-page37-elides-count'],['java.extraPartialPage']),
]},
{id:'window',question:'Window를 쓰면 위치 전략도 항상 키셋일까?',source:scope+' · 원문 keyset loop / 추가 offset windows',sourceNote:'원문 consume 본문은 주석뿐입니다.600개 방문은 관찰 wrapper의 결과 집계이며 DTO 변환·업무 처리·HTTP 응답600개를 실행한 것이 아닙니다.',note:'Window의 반환 타입과 위치 전략을 구분합니다. 초기 offset()과 이미 소비한 위치 offset(0)은 다릅니다. '+limits,stages:[
 stage('window','keyset','원문12창이600개를 중복없이 방문','원문 keyset 시작·positionAt(last) 반복은12개 Window에서600개 고유 id를 정렬대로 반환했습니다. 첫11개는 JDBC51행, 마지막은50행이며 last=true로 반복이 끝났습니다.','Window<Article> window = repository.findFirst50ByStatusOrderByPublishedAtDescIdDesc(\n    "PUBLISHED", ScrollPosition.keyset());\n// 원문 loop의 다음 위치\nScrollPosition next = window.positionAt(window.size() - 1);',[['원문 Window 수 / 고유 방문','12 / 600'],['JDBC 행 수','첫11창51 / 마지막창50'],['첫 창 반환 cursor','id700000 / publishedAt=2026-09-01T12:00'],['마지막 창','699499 → 699450 / last=true / hasNext=false'],['원문 compare 관측 SQL','Page2 + Slice1 + Window12 = 15 · 자원 close 확인']],['source-keyset12windows600unique','source-keyset-order-full-tuple','source-fifteen-sql-statements','source-window-peeks51-except-final50','source-statements-and-resultsets-closed','source-last-window-ends-loop','source-last-returned-position700000','source-subsequent-keyset-sql-has-boundary'],['java.originalCalls'],{active:[0,1,3]}),
 stage('window','offset','추가 offset Window는49 다음50부터','같은 원문 Window 메서드에 초기 offset()을 넣으면 첫50개를 받습니다. 마지막 반환 위치는 offset49이고 그 위치를 이어 주면 SQL offset50에서 다음50개를 받았습니다.','Window<Article> initial = original.findFirst50ByStatusOrderByPublishedAtDescIdDesc("PUBLISHED", ScrollPosition.offset());\nScrollPosition last = initial.positionAt(initial.size()-1);\nWindow<Article> next = original.findFirst50ByStatusOrderByPublishedAtDescIdDesc("PUBLISHED", last);',[['초기 반환 범위','700049 → 700000'],['마지막 반환 위치','offset49 · exclusive'],['다음 SQL offset','50'],['다음 반환 범위','699999 → 699950']],['extra-offset-position-exclusive49-then50'],['java.extraOffsetWindows.initial','java.extraOffsetWindows.next','java.extraOffsetWindows.queries.2'],{active:[0,1,2]}),
 stage('window','zero','offset(0)은첫행을 이미 소비한 위치','추가 offset(0)은 초기 위치가 아닙니다. 실제 SQL offset1에서 시작해700048..699999를 반환했습니다. offset()과 같은 시작이라고 해석하면 첫 행이 빠집니다.','Window<Article> zero = original.findFirst50ByStatusOrderByPublishedAtDescIdDesc(\n    "PUBLISHED", ScrollPosition.offset(0));',[['입력 위치','kind=offset / initial=false / offset=0'],['실제 SQL offset','1'],['반환 범위','700048 → 699999'],['위치 계약','exclusive · offset Window는 keyset 아님']],['extra-window-offset-is-not-keyset'],['java.extraOffsetWindows.offsetZero','java.extraOffsetWindows.queries.1'],{active:[0,1]}),
]},
{id:'sort',question:'PK·방향·NULL을 바꾸면 경계는 어떻게 될까?',source:scope+' · 추가 정렬·nullable probe',sourceNote:'원문은 publishedAt DESC,id DESC를 명시합니다. PK 생략 파생 메서드와 nullable SQL 테이블은 추가 대조군이며 원문 Repository·NOT NULL Article을 바꾸지 않았습니다.',note:limits,stages:[
 stage('sort','primary','추가 PK 생략 메서드는id ASC 보강','추가 findFirst3ByStatusOrderByPublishedAtDesc의 실제 SQL은 published_at DESC 뒤 id의 기본ASC를 보강했습니다. 반환은699980,699981,699982이고 cursor에도 두 키가 있습니다.','Window<Article> findFirst3ByStatusOrderByPublishedAtDesc(String status, ScrollPosition position);',[['추가 메서드 정렬','publishedAt DESC만 선언'],['실제 SQL 정렬','published_at DESC,id 기본ASC'],['반환 ids','[699980,699981,699982]'],['추가 SQL limit / JDBC 행','4 / 4 · Window 반환3개와 구분'],['cursor keys','id / publishedAt']],['extra-missing-pk-appends-ascending-id','extra-keyset-appends-missing-primary-key'],['java.extraPrimaryKeyAugmentation']),
 stage('sort','mixed','DESC·ASC 혼합이면id는>','추가 SQL의 published_at DESC,id ASC 첫3개 경계는699982/12:00입니다. 같은 시각 id> 조건은699983..985로 이어지지만 id<를 쓰면 이미 본699980·699981이 다시 나왔습니다.',"SELECT id FROM article WHERE status='PUBLISHED'AND(published_at<%s OR(published_at=%s AND id>%s))ORDER BY published_at DESC,id ASC LIMIT 3;",[['추가 첫 ids','[699980,699981,699982]'],['올바른 > 다음 ids','[699983,699984,699985]'],['잘못된 < 다음 ids','[699980,699981,699930]']],['extra-desc-asc-requires-id-greater'],['extra.mixedSort']),
 stage('sort','null','별도 nullable 값은단순<로꼬리에안감','별도 nullable_probe는 전체 정렬[3,2,1]에서 id1 시각이NULL입니다.11시보다작다는 단순 조건은 빈 결과여서 NULL 꼬리에 도달하지 않았습니다.',"SELECT id FROM nullable_probe WHERE published_at<'2026-09-01 11:00:00'ORDER BY published_at DESC,id DESC;",[['추가 nullable 전체 ids','[3,2,1] · id1 published_at=NULL'],['11시 경계의 단순 < 결과','[]'],['원문 가정 entity','publishedAt NOT NULL 그대로'],['미실행','JPA nullable keyset 실행 아님']],['extra-null-tail-not-returned-by-plain-inequality'],['extra.nullable']),
]},
{id:'shift',question:'앞 삽입·삭제가 다음 OFFSET을 어떻게 밀까?',source:scope+' · 추가 timeline 제어 순서',sourceNote:'앞 삽입·삭제·mutable 실험은 같은 writer 연결의 통제된 순서입니다. 이 주제를 다른 writer의 동시 요청이나 부하시험으로 표시하지 않습니다.',note:'추가 timeline 초기 id는[5,4,3,2,1]이며 크기3의 경계는id3/13시입니다. 각 변형은 reset_timeline으로 독립 초기화했습니다. '+limits,stages:[
 stage('shift','insert','앞에6을 넣으면OFFSET이3을반복','추가 첫 페이지는[5,4,3]입니다. 같은 writer가16시의id6을 앞에 넣은 뒤 OFFSET3은[3,2,1], 기존 경계 seek는[2,1]을 반환했습니다.',"INSERT INTO timeline VALUES(6,'2026-09-01 16:00:00');\n-- 같은 writer의 OFFSET3 / 기존 id3·13시 seek 비교",[['삽입 전 첫 페이지','[5,4,3]'],['앞 삽입 뒤 OFFSET3','[3,2,1] · 이미 본3 반복'],['기존 경계 keyset','[2,1]'],['실행 연결','같은 writer · 통제된 순서']],['extra-controlled-first-page543','extra-front-insert-offset-repeats3-keyset21'],['extra.insertAtFront']),
 stage('shift','delete','앞의5를삭제하면OFFSET은2를누락','별도 초기화 뒤 같은 writer가id5를 삭제했습니다. OFFSET3은[1]이라 아직 못 본2를 건너뛰고 경계 seek는[2,1]을 유지했습니다.','DELETE FROM timeline WHERE id=5;\n-- 같은 writer의 OFFSET3 / 기존 경계 seek 비교',[['삭제한 이전 행','id5'],['삭제 뒤 OFFSET3','[1]'],['기존 경계 keyset','[2,1]'],['실행 연결','같은 writer · 별도 초기화 변형']],['extra-prior-delete-offset-skips2-keyset21'],['extra.deletePrior']),
]},
{id:'mutable',question:'커서가 과거 삽입과 정렬키 이동도 고정할까?',source:scope+' · 추가 timeline 과거 삽입·변경',sourceNote:'이 추가 변형들도 같은 writer 연결에서 제어한 순서입니다. 명시적 두 연결 snapshot 실험은 다음 주제로 분리합니다.',note:'기존 커서 경계는13시/id3입니다. 뒤늦은 입력이나 정렬 키 변경은 경계의 뒤 집합을 바꿀 수 있어 커서 자체가 snapshot 계약이 아닙니다. '+limits,stages:[
 stage('mutable','backdated','과거시각id6은뒤결과에새로등장','같은 writer가id6을11:30으로 넣었습니다. 완전한 시각/id 경계는[2,6,1]을 읽지만 id<3만 쓰면[2,1]이라 이 과거 삽입을 누락합니다.',"INSERT INTO timeline VALUES(6,'2026-09-01 11:30:00');\n-- 기존13시/id3 seek와 id<3 추가 비교",[['완전한 keyset','[2,6,1]'],['id-only <3','[2,1]'],['입력6의 정렬 시각','2026-09-01 11:30:00 · 기존 경계 뒤']],['extra-backdated-insert-changes-later-results'],['extra.backdatedInsert']),
 stage('mutable','move','별도키이동은누락·재등장가능','서로 독립 초기화한 두 변형입니다. 아직 안 본id2를16시로 옮기면 seek가[1]만, 이미 본id4를11:30으로 옮기면[2,4,1]로4가 다시 나옵니다.',"reset_timeline()\nsql(\"UPDATE timeline SET published_at='2026-09-01 16:00:00'WHERE id=2\")\nunseen=ids(seek+' LIMIT 3')\nreset_timeline()\nsql(\"UPDATE timeline SET published_at='2026-09-01 11:30:00'WHERE id=4\")\nseen=ids(seek+' LIMIT 3')",[['안 본2를 앞쪽으로 이동','다음[1] · 2 누락'],['본4를 뒤쪽으로 이동','다음[2,4,1] · 4 재등장'],['실험 구분','각각 reset · 같은 변형의 연속 이동 아님']],['extra-mutable-key-can-miss-and-repeat'],['extra.mutableSortKeys'],{active:[1,2,4,5]}),
]},
{id:'snapshot',question:'명시한 하나의 DB snapshot과 새 조회는 어떻게 다를까?',source:scope+' · 별도 두 연결 RR snapshot',sourceNote:'이 주제만 writer의 명시 REPEATABLE READ transaction과 다른 observer 연결의 autocommit INSERT를 사용합니다. 여러 HTTP 요청이 자동으로 이 snapshot을 공유한다는 뜻이 아닙니다.',note:limits,stages:[
 stage('snapshot','same','한RR snapshot은[2,1]유지','writer가 consistent snapshot 안에서 첫[5,4,3]을 읽은 뒤 다른 연결이id6을16시에 넣었습니다. 같은 transaction의 OFFSET3은[2,1]을 읽었습니다.',"sql('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ')\nsql('START TRANSACTION WITH CONSISTENT SNAPSHOT')\nsnapshot_first=ids(ordered+' LIMIT 3')\nsql(\"INSERT INTO w15_demo.timeline VALUES(6,'2026-09-01 16:00:00')\",connection=observer)\nsnapshot_next=ids(ordered+' LIMIT 3 OFFSET 3')",[['writer 첫 결과','[5,4,3]'],['별도 연결 변경','id6/16시 INSERT · autocommit'],['같은 RR transaction의 다음','[2,1]'],['실험 주체','이 변형은 명시적으로 두 연결']],['extra-one-rr-snapshot-vs-fresh-read'],['extra.explicitSnapshot'],{active:[1,3,4]}),
 stage('snapshot','fresh','commit뒤새조회는[3,2,1]','writer가 transaction을 commit한 뒤 같은 OFFSET3을 새로 읽었습니다. 이제 앞 삽입id6이 반영되어 결과는[3,2,1]이며 앞 snapshot과 다릅니다.',"sql('COMMIT')\nfresh=ids(ordered+' LIMIT 3 OFFSET 3')",[['같은 transaction의 이전 결과','[2,1]'],['commit 뒤 새 조회 결과','[3,2,1]'],['한계','cursor 토큰 자체는 DB snapshot이 아님']],['extra-one-rr-snapshot-vs-fresh-read'],['extra.explicitSnapshot'],{active:[0,1]}),
]},
{id:'token',question:'Base64·HMAC·계약 확인은 같은 보장일까?',source:scope+' · 추가 공개 테스트키·toy parser',sourceNote:'공개 고정 테스트키와 추가 validContract toy parser를 사용했습니다. 실제 서비스 토큰 API·권한 검사·비밀 관리·입력 전체 검증을 구현한 결과가 아닙니다.',note:'원문 JSON 예시는 계약 설명으로 보존합니다. 아래 payload/Base64/HMAC은 별도 추가 실험이며 실제 HTTP 응답 토큰이 아닙니다. '+limits,stages:[
 stage('token','encoding','Base64는변조해도해독됨','추가 payload의id700000을700001로 바꾸어 Base64URL을 다시 만들었습니다. 변조 문자열도 정상 decode되어 인코딩 자체가 위조 검증이 아님을 확인했습니다.','String tampered = payload.replace("700000","700001");\nString tamperedEncoded = Base64.getUrlEncoder().withoutPadding()\n    .encodeToString(tampered.getBytes(StandardCharsets.UTF_8));',[['추가 payload','v1 / PUBLISHED / publishedAt:DESC,id:DESC / id700000'],['변조한 필드','id700001'],['Base64 decode','변조 문자열도 정상 해독']],['extra-base64-tamper-still-decodes'],['java.extraToken'],{active:[0,1,2]}),
 stage('token','tamper','추가HMAC비교는변조를검출','공개된 fixture 키로 원래 payload의HMAC을 만든 뒤 바꾼payload의HMAC과 비교했습니다. isEqual 비교는 false여서 코드의 !isEqual 검증식은 true였습니다. Base64 decode 성공과 다른 검사입니다.','!MessageDigest.isEqual(signature,\n    mac.doFinal(tampered.getBytes(StandardCharsets.UTF_8)));',[['추가 알고리즘','HmacSHA256'],['키 범위','공개 fixture string · production secret 아님'],['원본 서명 vs 변조 HMAC','동일하지 않음'],['서비스 구현','인증·HTTP API 실행 아님']],['extra-hmac-tamper-fails'],['java.extraToken'],{active:[0,1]}),
 stage('token','contract','유효서명이어도필터·정렬·버전다르면거부','추가 validContract는 문자열의v/status/sort만 비교하는 toy parser입니다. 유효한 원본서명과 일치계약은 true지만 DRAFT 필터·id:ASC 정렬·version2 요구는 각각 false였습니다.','signatureValid && validContract(payload,"1","PUBLISHED","publishedAt:DESC,id:DESC");\n// 추가 대조: DRAFT / id:ASC / version2 · 실제 서비스 권한 검사 아님',[['일치하는 추가 계약','true'],['유효서명 + 다른 필터 DRAFT','false'],['유효서명 + 다른 정렬 id:ASC','false'],['유효서명 + 다른 버전2','false'],['toy parser 범위','v/status/sort 비교 · id/시각/권한 전체 검증 아님']],['extra-signed-payload-matching-contract-accepted','extra-valid-signature-wrong-filter-rejected','extra-valid-signature-wrong-sort-rejected','extra-valid-signature-wrong-version-rejected'],['java.extraToken']),
]},
];
export const W15_ASSETS={
  "W15-offset": {
    "file": "W15-offset-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 결과의 OFFSET과 seek에서 index iterator500/50을 비교한 실제 MySQL8.4.11 관측",
    "focus": {
      "offset-first": [
        1,
        18,
        33,
        62
      ],
      "offset-deep": [
        34,
        18,
        32,
        62
      ],
      "offset-aligned": [
        66,
        18,
        33,
        62
      ],
      "offset-plan": [
        34,
        18,
        65,
        62
      ]
    }
  },
  "W15-boundary": {
    "file": "W15-boundary-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 boundary의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "boundary-tuple": [
        3,
        8,
        31,
        55
      ],
      "boundary-timestamp": [
        19,
        65,
        72,
        27
      ],
      "boundary-peek": [
        35,
        8,
        63,
        55
      ]
    }
  },
  "W15-page": {
    "file": "W15-page-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 spring의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "spring-page": [
        1,
        3,
        33,
        77
      ],
      "spring-slice": [
        34,
        3,
        32,
        77
      ],
      "spring-partial": [
        66,
        3,
        33,
        77
      ]
    }
  },
  "W15-window": {
    "file": "W15-window-v2.jpg",
    "width": 1672,
    "height": 940,
    "ready": true,
    "alt": "W15 window의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "window-keyset": [
        1,
        1,
        48,
        44
      ],
      "window-offset": [
        50,
        1,
        49,
        44
      ],
      "window-zero": [
        1,
        47,
        48,
        41
      ]
    }
  },
  "W15-sort": {
    "file": "W15-sort-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 sort의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "sort-primary": [
        70,
        14,
        28,
        58
      ],
      "sort-mixed": [
        38,
        14,
        32,
        58
      ],
      "sort-null": [
        1,
        73,
        98,
        25
      ]
    }
  },
  "W15-shift": {
    "file": "W15-shift-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 shift의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "shift-insert": [
        1,
        17,
        98,
        39
      ],
      "shift-delete": [
        1,
        58,
        98,
        35
      ]
    }
  },
  "W15-mutable": {
    "file": "W15-mutable-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 mutable의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "mutable-backdated": [
        1,
        2,
        33,
        86
      ],
      "mutable-move": [
        35,
        2,
        64,
        86
      ]
    }
  },
  "W15-snapshot": {
    "file": "W15-snapshot-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 snapshot의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "snapshot-same": [
        1,
        17,
        66,
        65
      ],
      "snapshot-fresh": [
        68,
        17,
        30,
        65
      ]
    }
  },
  "W15-token": {
    "file": "W15-token-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "W15 token의 원문 SQL·Java와 추가 fixture 실제 값·시점·실행 범위",
    "focus": {
      "token-encoding": [
        1,
        20,
        33,
        65
      ],
      "token-tamper": [
        34,
        20,
        32,
        65
      ],
      "token-contract": [
        66,
        20,
        33,
        65
      ]
    }
  }
};
