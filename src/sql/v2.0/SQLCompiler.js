(function () {

    const FSM = {
        SCANNER: {
            STATES: {
                CHAR: 1,
                WORD: 2,
                HANDLE: 0,
            }
        },
        PARSER: {
            STATES: {
                WORD: 1,
                EXPR: 2,
                CLAUSE: 3,
                SENTENCE: 4,
                HANDLE: 0,
            }
        },
    };
    const WORD_TABLE = {
        // 序列
        "sequence": {

            keyword: {

                sentence: ["select", "update", "insert", "delete"],
                clause: ["union", "set", "values", "from", "where", "left", "inner", "right", "join", "group", "having", "order", "limit"],

                other: ["into", "between", "and", "as", "like", "not", "desc", "asc", "on", "is", "or", "all", "by"],
                function: ["count", "max", "min", "sum", "avg", "distinct"],
                any: [],
            },

            identifier: {}
        },

        // 终止符
        "terminator": {

            punctuator: {

                arithmetic: ['+', '-', '*', '/', '%', 'div', 'mod'], // 算术符
                comparison: ['=', '>', '<', '!'], // 比较符
                constructors: ['.', '(', ')', ',', ';', '"', '\'', '`', ':'], // 构造符
                need_match: ['(', ')', '"', '\'', '`'], // 需要匹配的字符
                space: [' ', '\t', '\n', '\r'], // 空白符
                any: [],
            },
        },
    };

    let globalVariableContainer = {
        config: {},
    };
    let tool = {

        error(e) {

            // e.trace = e.trace.replace(/\n/g, " ");
            throw e.msg + "\n\n" + e.trace + "\n\n" + e.seq;
        },

        truncateStr(str, end) {
            return str.slice(0, end + 1);
        },

        // 创建连续的字符串
        makeContinuousStr(n, str = " ") {

            return new Array(n + 1).join(str);
        },

        propertyIsObj(obj) {

            return $.isPlainObject(obj);
        },

        // 因为折叠会出现索引连续不上和length不变的情况, 故而需要清理掉zombie数据
        rebuildASTIndex(obj) {

            let obj_str = JSON.stringify(obj);
            return JSON.parse(obj_str.replace(/,null/g, ""));
        },

        punctuatorMatchByStack(tokens, start, punctuator) {

            let stack = [], length = tokens.length, need_found_punctuator;
            switch (punctuator) {
                case "`":
                case "'":
                case '"':
                    need_found_punctuator = punctuator;
                    break;

                case "(":
                    need_found_punctuator = ")";
                    break;

                case ")":
                    need_found_punctuator = "(";
                    break;

                default:
                    tool.error({
                        'msg': "can not match this error punctuator '" + punctuator + "'",
                        "trace": "error near : " + this.truncateStr(scanner.props.stream, tokens[start].seq),
                        "seq": "seq: " + tokens[start].seq,
                    });
                    break;
            }

            for (let i = start + 1; i <= length - 1; ++i) {

                if (need_found_punctuator === tokens[i].value && stack.length < 1) {

                    return i;
                } else if (need_found_punctuator === tokens[i].value) {
                    stack.pop();
                } else if (punctuator === tokens[i].value) {

                    stack.push(tokens[i].value);
                }
            }

            tool.error({
                'msg': "no match this punctuator '" + punctuator + "'",
                "trace": "error near : " + this.truncateStr(scanner.props.stream, tokens[start].seq),
                "seq": "seq: " + tokens[start].seq,
            });
        },

        generateASTRootNode() {

            return {
                "node": "root",
                "state": "handle",
                "next_state": "sentence",
                "next_index": 0,
                "next": [],
            };
        },

        isUndefined(obj) {

            return "undefined" === typeof obj;
        }
    };

    // 词法分析器
    let scanner = {

        props: {

            stream: "", // 字符流
            length: 0, // 字符流的长度
            seq: 0, // 字符流的序号
            wordTable: WORD_TABLE,

            // 产物
            tokens: [],
        },

        init(stream) {

            this.props.stream = stream;

            this.before();
            this.start();
            this.after();
        },

        start() {

            let sequence = "";
            while (!tool.isUndefined(sequence = this.gets())) {

                if (sequence.length < 2) {
                    this.fsm.events.flowtoCharState(sequence);
                } else {
                    this.fsm.events.flowtoWordState(sequence);
                }
            }
        },

        // 从输入区读取字符序列，读到终止符为止
        gets() {

            let stream = this.props.stream;
            let length = stream.length;
            let seq = this.props.seq;

            for (let i = seq; i <= length - 1; ++i) {

                let sequence, ch = stream[i];
                if (this.props.wordTable.terminator.punctuator.any.indexOf(ch) > -1) {

                    if (seq === i) {

                        sequence = stream.slice(seq, i + 1);
                        this.props.seq = i + 1;
                    } else {
                        sequence = stream.slice(seq, i);
                        this.props.seq = i;
                    }

                    return sequence;
                }

                if (length - 1 === i) {

                    this.props.seq = i + 1;
                    return stream.slice(seq, i + 1);
                }
            }

            // stream最后的符号
            if (seq === length - 1) {
                this.props.seq = seq + 1;
                return stream.slice(seq, seq + 1);
            }

            return undefined;
        },

        // 前置处理
        before() {

            // 换行符替换为空格
            this.props.stream = $.trim(this.props.stream.replace(/\n/g, " ").toLowerCase());

            // 多个空格替换为1个空格
            this.props.stream = $.trim(this.props.stream.replace(/\s+/g, " ").toLowerCase());

            // 最后添加分号
            this.props.stream = this.props.stream.split(";")[0] + ";";

            // tokens 情空
            this.props.tokens = [];
            this.props.seq = 0;
        },

        // 后置处理
        after() {

            // 为符号做匹配处理
            for (let token of this.props.tokens) {

                if ("punctuator" !== token.type || this.props.wordTable.terminator.punctuator.need_match.indexOf(token.value) < 0) {
                    continue;
                }

                if (!tool.isUndefined(token.match_index)) {
                    continue;
                }

                let start = token.index;
                let end = tool.punctuatorMatchByStack(this.props.tokens, start, token.value);
                this.props.tokens[start].match_index = end;
                this.props.tokens[end].match_index = start;
            }
        },

        fsm: {

            state: FSM.SCANNER.STATES.HANDLE, // 当前机器的状态

            events: {

                // 转向Char状态
                flowtoCharState(ch) {

                    let index = scanner.props.tokens.length;
                    scanner.props.tokens.push({
                        "type": "punctuator",
                        "value": ch,
                        "index": index,
                        "seq": scanner.props.seq - ch.length + 1,
                    });
                    scanner.fsm.state = FSM.SCANNER.STATES.HANDLE;
                },

                // 转向Word状态
                flowtoWordState(sequence) {

                    let type;

                    if (!isNaN(sequence)) {
                        type = "Number";
                    } else if (scanner.props.wordTable.sequence.keyword.any.indexOf(sequence) > -1) {
                        type = "Keyword";
                    } else {
                        type = "Identifier";
                    }

                    let index = scanner.props.tokens.length;
                    scanner.props.tokens.push({
                        "type": type,
                        "value": sequence,
                        "index": index,
                        "seq": scanner.props.seq - sequence.length + 1,
                    });
                    scanner.fsm.state = FSM.SCANNER.STATES.HANDLE;
                }
            }
        }
    };

    // 语法解析器
    let parser = {

        props: {

            tokens: [], // token流
            wordTable: WORD_TABLE,

            // 产物
            ast: tool.generateASTRootNode(),
        },

        fsm: {

            state: FSM.PARSER.STATES.HANDLE,

            events: {

                // 转向Word状态
                flowtoWordState(token) {

                    let word = token.value;
                    if (parser.props.wordTable.sequence.keyword.sentence.indexOf(word) > -1) {

                        parser.fsm.state = FSM.PARSER.STATES.SENTENCE;
                        return;
                    } else if (parser.props.wordTable.sequence.keyword.clause.indexOf(word) > -1) {

                        parser.fsm.state = FSM.PARSER.STATES.CLAUSE;
                        return;
                    }

                    let root = parser.props.ast;
                    let sentence_node = root.next[root.next_index];
                    if (sentence_node.next_index >= sentence_node.next.length) {

                        sentence_node.next.push(parser.generateASTNode("clause", {}, {
                            "state": "clause",
                            "next_state": "word",
                        }));
                    }

                    let clause_node = sentence_node.next[sentence_node.next_index];
                    if (clause_node.next_index >= clause_node.next.length) {

                        let expression = "";
                        if (!tool.isUndefined(clause_node.value)) {
                            expression = clause_node.value;
                        } else if (!tool.isUndefined(sentence_node.value)) {
                            expression = sentence_node.value;
                        }
                        clause_node.next.push(parser.generateASTNode("expr", {}, {
                            "state": "expr",
                            "next_state": "word",
                            "expression": expression,
                        }));
                    }
                    clause_node.next_index = clause_node.next.length - 1;

                    let expr_node = clause_node.next[clause_node.next_index];
                    expr_node.next.push(parser.generateASTNode("word", token, {
                        "state": "word",
                        "next_state": "handle",
                    }));
                    expr_node.next_index = expr_node.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向expr状态
                flowtoExprState(token) {

                    let root = parser.props.ast;
                    let sentence_node = root.next[root.next_index];
                    let clause_node = sentence_node.next[sentence_node.next_index];

                    clause_node.next.push(parser.generateASTNode("expr", token, {
                        "state": "expr",
                        "next_state": "handle",
                    }));
                    clause_node.next_index = clause_node.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向clause状态
                flowtoClauseState(token) {

                    let root = parser.props.ast;
                    let sentence_node = root.next[root.next_index];
                    sentence_node.next.push(parser.generateASTNode("clause", token, {
                        "state": "clause",
                        "next_state": "handle",
                    }));
                    sentence_node.next_index = sentence_node.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向Sentence状态
                flowtoSentenceState(token) {

                    let root = parser.props.ast;
                    root.next.push(parser.generateASTNode("sentence", token, {
                        "state": "sentence",
                        "next_state": "handle",
                    }));
                    root.next_index = root.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                }
            },
        },

        parsing: {

            parsingExpr: {

                parsingExprForSelect() {


                },

                parsingExprForUpdate() {

                },

                parsingExprForInsert() {

                },

                parsingExprForDelete() {

                },

                parsingClauseOrder() {

                },
            }
        },

        init(tokens) {

            this.props.tokens = tokens;
            this.start();
        },

        start() {

            for (let token of this.props.tokens) {

                // token先流向词状态, 由词状态内部去抉择下一个状态是什么, 并返回创建的这个词节点
                this.fsm.events.flowtoWordState(token);

                // 如果不属于平衡状态(HANDLE状态), 则循环运行下去直到平衡为止
                while (FSM.PARSER.STATES.HANDLE !== this.fsm.state) {

                    switch (this.fsm.state) {
                        case FSM.PARSER.STATES.SENTENCE:
                            this.fsm.events.flowtoSentenceState(token);
                            break;
                        case FSM.PARSER.STATES.CLAUSE:
                            this.fsm.events.flowtoClauseState(token);
                            break;
                        case FSM.PARSER.STATES.EXPR:
                            this.fsm.events.flowtoExprState(token);
                            break;
                        default:
                            break;
                    }
                }
            }
        },

        // 生成AST节点
        generateASTNode(node, token, extra) {

            let ast_node = {

                "node": node, // 节点类型 root, sentence, clause, expr, word
                "state": extra.state, // 分析时所处状态 root, sentence, clause, expr, word 等同于 node
                "next_state": extra.next_state, // 下一个跳转状态 sentence, clause, expr, word
                "next_index": 0, // next数组的下标
                "next": [], // next数组, 新增的AST节点根据 next_index push 到目标 next 数组
            };

            if (!tool.isUndefined(token.value)) {
                ast_node.value = token.value;
            }

            if (!tool.isUndefined(extra.expression)) {
                ast_node.expression = extra.expression;
            }

            if ("{}" !== JSON.stringify(token)) {
                ast_node.token = token;
            }

            return ast_node;
        },
    };

    // 语义分析器
    let analyzer = {

        props: {},

        init() {

            this.start();
        },

        start() {

            this.optimize.combineNodes();
        },

        optimize: {

            // 节点合并
            combineNodes() {

                // group by, order by, left/right/inner join
                for (let i = 0; i <= parser.props.ast.next.length - 1; ++i) {

                    let sentence_node = parser.props.ast.next[i];
                    let clause_nodes = sentence_node.next;
                    for (let i = 0; i <= clause_nodes.length - 1; ++i) {

                        let current_clause_node = clause_nodes[i];
                        if (tool.isUndefined(current_clause_node) || tool.isUndefined(current_clause_node.value)) {
                            continue;
                        }

                        // 合并 join
                        if (["left", "right", "inner"].indexOf(current_clause_node.value) > -1) {

                            // 只有前置, 没有join
                            let next_clause_node = clause_nodes[i + 1];
                            if (tool.isUndefined(next_clause_node) || "join" !== next_clause_node.value) {

                                let seq = clause_nodes[i].token.seq - 1 + clause_nodes[i].value.length;
                                tool.error({
                                    "msg": "incorrect join expression",
                                    "trace": tool.truncateStr(scanner.props.stream, seq),
                                    "seq": seq
                                });
                            }

                            // 合并 join 后，由于left和join后面都有空格造成了多余空格的情况，所以需要删除一个空格
                            let n_index = next_clause_node.next_index;
                            let expr_node = next_clause_node.next[n_index];
                            let word_node = expr_node.next[0];
                            if (!tool.isUndefined(word_node) && " " === word_node.value) {
                                delete (expr_node.next[0]);
                            }

                            // 实现 join 合并
                            clause_nodes[i].value = clause_nodes[i].value + " join"; // concat
                            clause_nodes[i].next = clause_nodes[i].next.concat(next_clause_node.next); // attach

                            // 删除 join 并对 null 处理
                            delete (clause_nodes[i + 1]); // 删除(注 delete next_clause_node 无效)
                            sentence_node.next = tool.rebuildASTIndex(sentence_node.next);
                        }
                    }
                }
            },
        }
    };

    // 前端过程步骤
    let steps = {

        clear: {

            work() {

                parser.props.ast = tool.generateASTRootNode();
            }
        },

        lexicalAnalysis: {

            work() {

                let config = globalVariableContainer.config;
                scanner.init(config.sql);
            }
        },

        syntacticAnalysis: {

            work() {

                parser.init(scanner.props.tokens);
            }
        },

        semanticAnalysis: {

            work() {

                analyzer.init();
            }
        }
    };

    let SQLCompiler = function (config = {sql: ""}) {

        globalVariableContainer.config = Object.assign({sql: ""}, config);
    };

    SQLCompiler.prototype = {

        tool: tool,
        scanner: scanner,
        parser: parser,
        steps: steps,

        boot() {

            WORD_TABLE.sequence.keyword.any = (() => {

                return WORD_TABLE.sequence.keyword.sentence.concat(
                    WORD_TABLE.terminator.punctuator.clause,
                    WORD_TABLE.terminator.punctuator.other,
                );
            })();
            WORD_TABLE.terminator.punctuator.any = (() => {

                return WORD_TABLE.terminator.punctuator.arithmetic.concat(
                    WORD_TABLE.terminator.punctuator.comparison,
                    WORD_TABLE.terminator.punctuator.constructors,
                    WORD_TABLE.terminator.punctuator.need_match,
                    WORD_TABLE.terminator.punctuator.space,
                );
            })();

            this.init();
        },

        init() {

            this.steps.clear.work();
            this.steps.lexicalAnalysis.work();
            this.steps.syntacticAnalysis.work();
            this.steps.semanticAnalysis.work();
        },
    };

    $.fn.extend({

        SQLCompiler: function (config = {sql: ""}) {

            return $(this).each(function () {

                (new SQLCompiler(config)).boot();
            });
        },

        SQLCompilerAPI: {

            closure: {

                tool: tool,
                scanner: scanner,
                parser: parser,
            },

            format() {

                let sql = "";
                let indents = 0; // 记录当前的缩进
                let enters = 0; // 记录当前的行数
                let indent_str = "";
                let enter_str = "";

                function traverseObj(obj) {

                    if (!tool.propertyIsObj(obj)) {

                        return;
                    }

                    let properties = Object.getOwnPropertyNames(obj);
                    for (let property of properties) {

                        // 属性值是数组
                        if (Array.isArray(obj[property])) {

                            for (let item of obj[property]) {

                                traverseObj(item);
                            }

                        }

                        // 属性值是对象
                        else if (tool.propertyIsObj(obj[property])) {

                            traverseObj(obj[property]);
                        }

                        // 属性值是字面值
                        else {

                            if ("state" === property) {

                                if ("sentence" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    indents = 0;
                                    enter_str = tool.makeContinuousStr(enters === 0 ? 0 : 1, "\n");
                                    sql += (enter_str + obj['value']);
                                    ++enters;
                                } else if ("clause" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    // indents += 4;
                                    indents = 4;
                                    indent_str = tool.makeContinuousStr(indents, " ");
                                    enter_str = tool.makeContinuousStr(1, "\n");
                                    sql += (enter_str + indent_str + obj['value']);
                                    ++enters;
                                } else if (("expr" === obj[property] || "word" === obj[property]) && !tool.isUndefined(obj['value'])) {

                                    sql += obj['value'];
                                }
                            }
                        }
                    }
                }

                traverseObj(parser.props.ast);
                return {
                    sql: sql,
                    enters: enters,
                };
            },
        },
    });

})();