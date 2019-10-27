let translator = {

    /**
     * 配置字段说明
     *
     * Statement 配置
     * > support 和 contain 是一个组信息
     * support: (Array)  , 支持类型, 表示支持的N种 Statement 类型
     * contain: (Object) , 配置类型, 每一种支持的类型信息都要写在 contain 字段下
     *
     *     每一种 Statement 类型配置
     *     must 和 clause 是一组信息
     *     must:   (Bool)  , 是否必须有此子句
     *     clause: (String), 子句的类型
     *
     * Clause 配置
     * > support 和 contain 是一个组信息
     * support: (Array)  , 支持类型, 表示支持的N种 Clause 类型
     * contain: (Object) , 配置类型, 每一种支持的类型信息都要写在 contain 字段下
     *
     *     每一种 Clause 类型配置
     *     construct 和 require 是一组信息
     *     construct: (Array)  , 构造的N种规则
     *     require:   (Object) , 构造要求
     *
     *         construct 配置项
     *         require配置项
     *         > 当有多个构造规则时, 需要在require下的配置项外加 rule_n 字段
     *         item_order (Bool) 每一项是否有顺序要求
     *         item_limit (Bool, Int) 是否限制项的个数
     *         item_recursive_sign (Token) 每一项之间的递归标志
     */
    grammar: {

        // 默认的语法
        "default": {

            // 语句
            "statement": {

                // 支持的语句类型
                "support": ["select_statement", "update_statement", "delete_statement"],

                // 语句类型配置
                "contain": {

                    // select 语句
                    "select_statement": [
                        {
                            "must": true,
                            "clause": "select_clause",
                        },
                        {
                            "must": true,
                            "clause": "from_clause",
                        },
                        {
                            "must": false,
                            "clause": "where_clause",
                        },
                        {
                            "must": false,
                            "clause": "group_clause",
                        },
                        {
                            "must": false,
                            "clause": "having_clause",
                        },
                        {
                            "must": false,
                            "clause": "orderby_clause",
                        },
                        {
                            "must": false,
                            "clause": "limit_clause",
                        },
                    ],
                }
            },

            // 子句
            "clause": {

                // 支持的所有子句
                "support": ["select_clause", "from_clause", "where_clause", "group_clause", "having_clause", "orderby_clause", "limit_clause"],

                // 包含的子句
                "contain": {

                    // select 子句
                    "select_clause": {

                        // 构成方式
                        "construct": [

                            // 仅这1种组成
                            ["number_expr", "string_expr", "function_expr", "column_expr"],
                        ],

                        // 要求
                        "require": {

                            // 表达式是否有顺序限制
                            "item_order": false,

                            // 表达式个数的限制
                            "item_limit": false,

                            // 每一项之间的递归
                            "item_recursive": "meta",
                            "item_recursive_name": "comma_recursive_meta",
                        },
                    },
                    
                    // from 子句
                    "from_clause":{

                        // 构成方式
                        "construct": [

                            // 仅这1种组成
                            ["source_table_expr", "string_expr", "function_expr", "column_expr"],
                        ],
                    },
                    
                    "where_clause":{
                        
                    }
                },
            },

            // 表达式
            "expr": {

                // 支持的所有表达式
                "support": ["number_expr", "string_expr", "function_expr", "column_expr", "_expr"],

                // 包含的表达式
                "contain": {

                    // 数字表达式
                    "number_expr": {

                        // 可由 meta 替代, meta是number_meta
                        "replace": "meta",
                        "reference_name": "number_meta",
                    },

                    // 字符串表达式
                    "string_expr": {

                        // 可由 meta 替代, meta是string_meta
                        "replace": "meta",
                        "reference_name": "string_meta",
                    },

                    // 数据库表达式
                    "source_db_expr": {

                        // 可由 meta 替代, meta是source_db_meta
                        "replace": "meta",
                        "reference_name": "source_db_meta",
                    },

                    // 数据表表达式
                    "source_table_expr": {

                        // 可由 meta 替代, meta是source_db_meta
                        "replace": "meta",
                        "reference_name": "source_table_meta",
                    },

                    // 数据表字段表达式
                    "source_column_expr": {

                        // 可由 meta 替代, meta是source_db_meta
                        "replace": "meta",
                        "reference_name": "source_column_meta",
                    },

                    // 函数表达式
                    "function_expr": {

                        // 构成方式
                        "construct": [

                            // 第1种构成
                            [
                                {"type": "Identifier"},
                                {"type": "Punctuator", "value": "("},
                                {"reference": "meta", "reference_name": "function_param_meta"},
                                {"type": "Punctuator", "value": ")"}
                            ],
                        ],

                        // 要求
                        "require": {

                            // 每一项必须按照构成的顺序
                            "item_order": true,

                            // 必须由3项组成
                            "item_limit": 4,
                        },
                    },
                },
            },

            "meta": {

                // 逗号递归符元信息
                "comma_recursive_meta": {

                    // 构成
                    "construct": [

                        // 仅有1种构成方式
                        [{"type": "Punctuator", "value": ","}]
                    ],

                    // 要求
                    "require": {

                        // 组成的每一项必须按顺序
                        "item_order": true,
                        "item_limit": 1, // 必须由1项组成
                    },
                },

                // 数字元信息
                "number_meta": {

                    // 构成
                    "construct": [

                        // 仅有1种构成方式
                        [{"type": "number"}]
                    ],

                    // 要求
                    "require": {

                        // 组成的每一项必须按顺序
                        "item_order": true,
                        "item_limit": 1, // 必须由1项组成
                    },
                },

                // 字符串元信息
                "string_meta": {

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

                        // 每一项必须按照构成的顺序
                        "item_order": true,

                        // 必须由3项组成
                        "item_limit": 3,
                    },
                },

                // 数据库元信息
                "source_db_meta": {

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
                    ],

                    // 构成要求
                    "require": {

                        "rule_1": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 3, // 必须由3项组成
                        },

                        "rule_2": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 1, // 必须由1项组成
                        }
                    },
                },

                // 数据表元信息
                "source_table_meta": {

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

                        // 第3种构成方式
                        [
                            {"reference": "meta", "meta_reference_name": "source_db_meta"},
                            {"type": "Punctuator", "value": "."},
                            {"reference": "meta", "meta_reference_name": "source_db_meta"},
                        ]
                    ],

                    // 构成要求
                    "require": {

                        "rule_1": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 3, // 必须由3项组成
                        },

                        "rule_2": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 1, // 必须由1项组成
                        },

                        "rule_3": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 3, // 必须由1项组成
                        }
                    },
                },

                // 数据表字段信息
                "source_column_meta": {

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

                        // 第3种构成方式
                        [
                            {"reference": "meta", "meta_reference_name": "source_table_meta"},
                            {"type": "Punctuator", "value": "."},
                            {"reference": "meta", "meta_reference_name": "source_db_meta"},
                        ]
                    ],

                    // 构成要求
                    "require": {

                        "rule_1": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 3, // 必须由3项组成
                        },

                        "rule_2": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 1, // 必须由1项组成
                        },

                        "rule_3": {

                            "item_order": true,// 每一项必须按照构成的顺序
                            "item_limit": 3, // 必须由1项组成
                        }
                    },
                },

                // 函数参数元信息
                "function_param_meta": {

                    // 构成方式
                    "construct": [

                        // 第1种构成
                        [
                            {"reference": "meta", "reference_name": "source_column_meta"},
                            {"type": "Number"},
                            {"type": "String"},
                        ],
                    ],

                    // 构成要求
                    "require": {

                        // 每一项无顺序
                        "item_order": false,

                        // 不限制组成项的个数
                        "item_limit": false,

                        // 每一项之间的递归
                        "item_recursive": "meta",
                        "item_recursive_name": "comma_recursive_meta",
                    },
                },
            },
        },

        "oracle": {},

        "mysql": {},
    },
};