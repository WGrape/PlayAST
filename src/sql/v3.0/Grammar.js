/**
 * 1. 常用语法 : as 别名
 */
(function () {

    // 共用
    let common_word = {

        source_db_word: {

            // 构成方式
            "construct": [

                // 第1种构成(有 "`" 符号)
                [
                    {"type": "Punctuator", "value": "`"},
                    {"type": "Identifier"},
                    {"type": "Punctuator", "value": "`"}
                ],

                // 第2种构成(无 "`" 符号)
                [
                    {"type": "Identifier"},
                ],

                // 第3种构成(*)
                [
                    {"type": "Punctuator", "value": "*"},
                ],
            ],

            // 构成要求
            "require": {

                "rule_0": {

                    "item_count": 3,
                },

                "rule_1": {

                    "item_count": 1,
                },

                "rule_2": {

                    "item_count": 1,
                },
            },
        }
    };

    // 避免双向引用
    let double_reference_word = {

        source_table_word: {

            // 构成方式
            "construct": [

                ...common_word.source_db_word.construct,
                [
                    {"reference": "word", "reference_name": "source_db_word"},
                    {"type": "Punctuator", "value": "."},
                    {"reference": "word", "reference_name": "source_db_word"},
                ]
            ],

            // 构成要求
            "require": {

                ...common_word.source_db_word.require,
                "rule_3": {

                    "item_count": 3
                }
            },
        }
    };

    // word 产生式
    let word = {

        // 逗号递归符原子信息
        comma_recursive_word: {

            // 构成
            "construct": [

                // 仅有1种构成方式
                [{"type": "Punctuator", "value": ","}]
            ],

            // 要求
            "require": {

                "item_count": 1,
            },
        },

        and_recursive_word: {

            // 构成
            "construct": [

                // 仅有1种构成方式
                [{"type": "Keyword", "value": "and"}]
            ],

            // 要求
            "require": {

                "item_count": 1, // 必须由1项组成
            },
        },

        or_recursive_word: {

            // 构成
            "construct": [

                // 仅有1种构成方式
                [{"type": "Keyword", "value": "or"}]
            ],

            // 要求
            "require": {

                "item_count": 1, // 必须由1项组成
            },
        },

        // 数字原子信息
        number_word: {

            // 构成
            "construct": [

                // 仅有1种构成方式
                [{"type": "number"}]
            ],

            // 要求
            "require": {

                "item_count": 1,
            },
        },

        // 字符串原子信息
        string_word: {

            // 构成方式
            "construct": [

                // 第1种构成
                [
                    {"type": "Punctuator", "value": "\""},
                    {"type": "Identifier"},
                    {"type": "Punctuator", "value": "\""}
                ],

                // 第2种构成
                [
                    {"type": "Punctuator", "value": "\'"},
                    {"type": "Identifier"},
                    {"type": "Punctuator", "value": "\'"}
                ],
            ],

            // 构成要求
            "require": {

                // 必须由3项组成
                "item_count": 3,
            },
        },

        // 数据库原子信息
        source_db_word: common_word.source_db_word,

        // 数据表原子信息
        source_table_word: double_reference_word.source_table_word,

        // 数据表字段信息
        source_column_word: {

            // 构成方式
            "construct": [

                ...double_reference_word.source_table_word.construct,
                [
                    {"reference": "word", "reference_name": "source_table_word"},
                    {"type": "Punctuator", "value": "."},
                    {"reference": "word", "reference_name": "source_db_word"},
                ]
            ],

            // 构成要求
            "require": {

                ...double_reference_word.source_table_word.require,
                "rule_4": {},
            }
        },

        // 函数参数原子信息
        function_param_word: {

            // 构成方式
            "construct":
                [

                    // 第1种构成
                    [
                        {"reference": "word", "reference_name": "source_column_word"},
                        {"type": "Number"},
                        {"type": "String"},
                    ],
                ],

            // 构成要求
            "require": {

                // 不限制组成项的个数
                "item_count": [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],

                // 每一项之间的递归
                "item_recursive": "word.comma_recursive_word",
            },
        }
        ,
    };

    // expr 产生式
    let expr = {

        // 数字表达式
        number_expr: word.number_word,

        // 字符串表达式
        string_expr: word.string_word,

        // 数据库表达式
        source_db_expr: word.source_db_word,

        // 数据表表达式
        source_table_expr: word.source_table_word,

        // 数据表字段表达式
        source_column_expr: word.source_column_word,

        function_param_expr: word.function_param_word,

        // 函数表达式
        function_expr: {

            // 构成方式
            "construct": [

                // 第1种构成
                [
                    {"type": "Identifier"},
                    {"type": "Punctuator", "value": "("},
                    {"reference": "expr", "reference_name": "function_param_expr"},
                    {"type": "Punctuator", "value": ")"}
                ],
            ],

            // 要求
            "require": {

                "item_count": 4,
            },
        },

        // 子查询表达式
        subquery_expr: {

            "construct": [

                [
                    {"type": "Punctuator", "value": "("},
                    {"reference": "statement", "reference_name": "select_statement"},
                    {"type": "Punctuator", "value": ")"},
                ]
            ],

            "require": {},
        },

    };

    // clause 产生式
    let clause = {

        select_clause: {

            // 构成方式
            "construct": [

                // 仅这1种组成
                [
                    {
                        "reference": "expr",
                        "reference_name": "number_expr",
                    },
                    {
                        "reference": "expr",
                        "reference_name": "string_expr",
                    },
                    {
                        "reference": "expr",
                        "reference_name": "function_expr",
                    },
                    {
                        "reference": "expr",
                        "reference_name": "source_column_expr",
                    },
                ],
            ],

            // 要求
            "require": {

                "item_count": [1, Number.POSITIVE_INFINITY],

                // 每一项之间的递归
                "item_recursive": "word.comma_recursive_word",
            },
        },

        from_clause: {

            // 构成方式
            "construct": [

                [
                    {
                        "reference": "expr",
                        "reference_name": "source_table_expr",
                    }
                ],

                [
                    {
                        "reference": "expr",
                        "reference_name": "subquery_expr",
                    }
                ],
            ],

            "require": {

                "rule_0": {
                    "item_count": [1, Number.POSITIVE_INFINITY],
                },

                "rule_1": {
                    "item_count": [1, Number.POSITIVE_INFINITY],
                },
            },
        },

        where_clause: {},
        group_clause: {},
        having_clause: {},
        orderby_clause: {},
        limit_clause: {}
    };

    // statement 产生式
    let statement = {

        // select 语句
        "select_statement": {

            // 构成方式
            "construct": [

                // 第1种构成方式
                [
                    {
                        "reference": "clause",
                        "reference_name": "select_clause",
                        "must": true,
                    },
                    {
                        "reference": "clause",
                        "reference_name": "from_clause",
                        "must": true,
                    },
                    {
                        "reference": "clause",
                        "reference_name": "where_clause",
                        "must": false,
                    },
                    {
                        "reference": "clause",
                        "reference_name": "group_clause",
                        "must": false,
                    },
                    {
                        "reference": "clause",
                        "reference_name": "having_clause",
                        "must": false,
                    },
                    {
                        "reference": "clause",
                        "reference_name": "orderby_clause",
                        "must": false,
                    },
                    {
                        "reference": "clause",
                        "reference_name": "limit_clause",
                        "must": false,
                    },
                ]
            ],

            // 要求
            "require": {
                "item_count": [2, Number.POSITIVE_INFINITY]
            },
        },

        // update 语句
        "update_statement": {},

        // delete 语句
        "delete_statement": {},
    };


    // 语法
    window.grammar = {

        // 默认的语法
        default: {},

        oracle: {},

        mysql: {

            // 语句
            "statement": {

                "select_statement": statement.select_statement,

                "update_statement": statement.update_statement,

                "delete_statement": statement.delete_statement,

            },
        },
    };

    window.grammar.closure = {

        common_word: common_word,
        double_reference_word: double_reference_word,
        word: word,
        expr: expr,
        clause: clause,
        statement: statement,
    };

})();
