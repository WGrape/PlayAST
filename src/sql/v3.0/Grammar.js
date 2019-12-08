/**
 *
 * 1. must默认false
 * 2. 当前的产生式匹配失败时，转向下一个产生式
 * 3. 只能平行引用, 不能垂直引用
 */

// Atom 产生式
let atom = {

    // 逗号递归符原子信息
    comma_recursive_atom: {

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

    and_recursive_atom: {

        // 构成
        "construct": [

            // 仅有1种构成方式
            [{"type": "Keyword", "value": "and"}]
        ],

        // 要求
        "require": {

            // 组成的每一项必须按顺序
            "item_order": true,
            "item_limit": 1, // 必须由1项组成
        },
    },

    or_recursive_atom: {

        // 构成
        "construct": [

            // 仅有1种构成方式
            [{"type": "Keyword", "value": "or"}]
        ],

        // 要求
        "require": {

            // 组成的每一项必须按顺序
            "item_order": true,
            "item_limit": 1, // 必须由1项组成
        },
    },

    // 数字原子信息
    number_atom: {

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

    // 字符串原子信息
    string_atom: {

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

    // 数据库原子信息
    source_db_atom: {

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
                {"type": "Punctuator", "value":"*"},
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

    // 数据表原子信息
    source_table_atom: {

        // 构成方式
        "construct": [

            this.source_db_atom.construct,
            [
                {"reference": "atom", "reference_name": "source_db_atom"},
                {"type": "Punctuator", "value": "."},
                {"reference": "atom", "reference_name": "source_db_atom"},
            ]
        ],

        // 构成要求
        "require": {

            "rule_1": this.source_db_atom.require.rule_1,
            "rule_2": this.source_db_atom.require.rule_2,
            "rule_3": {

                "item_order": true,// 每一项必须按照构成的顺序
                "item_limit": 3, // 必须由1项组成
            }
        },
    },

    // 数据表字段信息
    source_column_atom: {

        // 构成方式
        "construct": [

            this.source_table_atom,
            [
                {"reference": "atom", "reference_name": "source_table_atom"},
                {"type": "Punctuator", "value": "."},
                {"reference": "atom", "reference_name": "source_db_atom"},
            ]
        ],

        // 构成要求
        "require": this.source_table_atom.require,
    },

    // 函数参数原子信息
    function_param_atom: {

        // 构成方式
        "construct": [

            // 第1种构成
            [
                {"reference": "atom", "reference_name": "source_column_atom"},
                {"type": "Number"},
                {"type": "String"},
            ],
        ],

        // 构成要求
        "require": {

            // 不限制组成项的个数
            "item_limit": false,

            // 每一项之间的递归
            "item_recursive": "atom",
            "item_recursive_name": "comma_recursive_atom",
        },
    },
};

// expr 产生式
let expr = {

    // 数字表达式
    number_expr: atom.number_atom,

    // 字符串表达式
    string_expr: atom.string_atom,

    // 数据库表达式
    source_db_expr: atom.source_db_atom,

    // 数据表表达式
    source_table_expr: atom.source_table_atom,

    // 数据表字段表达式
    source_column_expr: atom.source_column_atom,

    function_param_expr: atom.function_param_atom,

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

            "item_order": true,
            "item_limit": 4,
        },
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
                    "must":false,
                },
                {
                    "reference": "expr",
                    "reference_name": "string_expr",
                    "must":false,
                },
                {
                    "reference": "expr",
                    "reference_name": "function_expr",
                    "must":false,
                },
                {
                    "reference": "expr",
                    "reference_name": "source_column_expr",
                    "must":false,
                },
            ],
        ],

        // 要求
        "require": {

            // 每一项是否可以出现多次
            "item_revive": true,

            // 最少有几项
            "item_min": 1,

            // 每一项之间的递归
            "item_recursive": "atom",
            "item_recursive_name": "comma_recursive_atom",
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
                {"type": "Punctuator", "value": "("},
                {"type": "Punctuator", "value": ")"},
            ],
        ],

        "rule":{

            "rule_1" : {
                "item_order" : true,
                "item_limit" : 1,
            },

            "rule_2" : {
                "item_order" : true,
                "item_limit" : 2,
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
                    "must":true,
                },
                {
                    "reference": "clause",
                    "reference_name": "from_clause",
                    "must":true,
                },
                {
                    "reference": "clause",
                    "reference_name": "where_clause",
                    "must":true,
                },
                {
                    "reference": "clause",
                    "reference_name": "group_clause",
                    "must":true,
                },
                {
                    "reference": "clause",
                    "reference_name": "having_clause",
                    "must":true,
                },
                {
                    "reference": "clause",
                    "reference_name": "orderby_clause",
                    "must":true,
                },
                {
                    "reference": "clause",
                    "reference_name": "limit_clause",
                    "must":true,
                },
            ]
        ],

        // 要求
        "require": {

            // 子句是否有顺序限制
            "item_order": true,

            // 每个子句出现次数是否可以多次
            "item_revive": false,

            // 子句个数的限制
            "item_limit": 7,

            // 每一项之间的递归
            "item_recursive": false,
        },
    },
};

// 语法
let grammar = {

    // 默认的语法
    default: {

        // 语句
        "statement": {

            // 支持的语句类型
            "support": ["select_statement", "update_statement", "delete_statement"],

            // 语句类型配置
            "contain": {

                // select 语句
                "select_statement": {

                    // 构成方式
                    "construct": [

                        // 第1种构成方式
                        [
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
                        ]
                    ],

                    // 要求
                    "require": {

                        // 子句是否有顺序限制
                        "item_order": true,

                        // 每个子句出现次数是否可以多次
                        "item_revive": false,

                        // 子句个数的限制
                        "item_limit": 7,

                        // 每一项之间的递归
                        "item_recursive": false,
                    },
                },
            }
        },
    },

    oracle: {},

    mysql: {},
};

