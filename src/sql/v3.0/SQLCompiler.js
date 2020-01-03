/**
 * TODO:
 * 1. 编程要定义最少的数据源, 多数据源则会造成编程的杂乱(不只数据源, 修改操作等都要求少, 而不是求多)
 * 2. 自动报错, 提供一种类似最外层 try-catch 机制, 实现错误步骤
 */
(function () {

    // 常量表
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
                STATEMENT: 4,
                HANDLE: 0,
            }
        },
        TRANSLATOR: {
            STATES: {
                STATEMENT: 1,
                CLAUSE: 2,
                EXPR: 3,
                WORD: 4,
                HANDLE: 0,
            },
        },
    };
    const PARSING_PROCESS = {
        SUCCESS: 0,
        FAILURE: 1,
        PENDING: 2,
    };
    const WORD_TABLE = {
        // 序列
        "sequence": {

            keyword: {

                statement: ["select", "update", "insert", "delete"],
                clause: ["union", "set", "values", "from", "where", "left", "inner", "right", "join", "group", "having", "order", "limit"],

                other: ["into", "between", "and", "as", "like", "not", "desc", "asc", "on", "is", "or", "all", "by", "null"],
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
                illegal: [',', ':'], // 不应该在末端出现的非法字符
                any: [],
            },
        },
    };
    const ERRNO = {
        SUCCESS: 0,
    };

    // 全局变量表
    let globalVariableContainer = {

        // 所有的配置都写这里, 不要写在 tool 里面
        config: {},
    };
    let tool = {

        error(e) {

            // e.trace = e.trace.replace(/\n/g, " ");
            throw e.msg + "\n\n" + e.trace + "\n\n" + e.seq;
        },

        debug(msg, data = false) {

            if (!globalVariableContainer.config.debug) {
                return;
            }

            if (1 !== globalVariableContainer.config.log_n) {
                console.log("\n\n");
            }

            console.warn(globalVariableContainer.config.log_n + ": " + msg);

            if (false !== data) {
                console.log(data);
            }

            globalVariableContainer.config.log_n++;
        },

        truncateStr(str, end) {
            return str.slice(0, end + 1);
        },

        isNumber(x) {

            return "[object Number]" === Object.prototype.toString.call(x);
        },

        isString(x) {

            return "[object String]" === Object.prototype.toString.call(x);
        },

        isArray(x) {

            return "[object Array]" === Object.prototype.toString.call(x);
        },

        isObject(x) {

            return "[object Object]" === Object.prototype.toString.call(x);
        },

        empty(x) {

            if (this.isNumber(x)) {
                return 0 === x;
            }

            if (this.isString(x) || this.isArray(x)) {
                return 0 === x.length;
            }

            if (this.isObject(x)) {
                return $.isEmptyObject(x);
            }

            return false;
        },

        // 创建连续的字符串
        makeContinuousStr(n, str = " ") {

            return new Array(n + 1).join(str);
        },

        // 生成错误号
        errnoGenerator() {

            if (this.empty(arguments)) {

                let i = 0, max_retries = 10, errno = -1;
                while (i <= max_retries) {

                    ++i;
                    errno = Math.ceil(Math.random() * 1000000);
                    if (!this.empty(errno)) {
                        break;
                    }
                }
                if (this.empty(errno)) {
                    errno = -1;
                }

                return errno;
            }

            return -2;
        },

        makeErrObj(msg, errno, data = {}) {

            return {
                msg: msg,
                data: data,
                errno: errno,
            };
        },

        recoverErrObj(obj) {

            if (0 === obj.errno) {

                // 隐蔽类错误
                console.log(obj);
                return;
            }

            // 明确类错误
            throw obj;
        },

        propertyIsObj(obj) {

            return $.isPlainObject(obj);
        },

        pureValueAssign(value) {

            return JSON.parse(JSON.stringify(value));
        },

        isEmptyArray(arr) {

            if (this.empty(arr)) {
                return true;
            }

            return arr.every((arr) => {
                return this.empty(arr);
            });
        },

        isFunction(fn) {

            return Object.prototype.toString.call(fn) === '[object Function]';
        },

        // 移除数组中指定位置的元素, 且自动改变长度
        arrayRemove(arr, index) {

            return arr.splice(index, 1);
        },

        // 创造N个数组
        newNArray(n) {

            let result = [];

            for (let i = 1; i <= n; ++i) {

                result.push([]);
            }

            return result;
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

                if (need_found_punctuator === tokens[i].value && this.empty(stack)) {

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

        /**
         * 当前token是否是子查询的起始标志
         * @param token
         * @returns {boolean}
         */
        isSubqueryStartToken(token) {

            if (!("Punctuator" === token.type && "(" === token.value)) {
                return false;
            }

            for (let i = token.index - 1; i >= 0; --i) {

                let i_token = scanner.props.tokens[i];
                if ("Punctuator" === i_token.type && " " === i_token.value) {
                    continue;
                }
                return ("Keyword" === i_token.type && "from" === i_token.value);
            }

            return false;
        },

        /**
         * 当前token是否是子查询的终止标志
         * @param token
         * @returns {*}
         */
        isSubqueryEndToken(token) {

            if (!("Punctuator" === token.type && ")" === token.value)) {
                return false;
            }

            let image_token = scanner.props.tokens[token.match_index];

            return tool.isSubqueryStartToken(image_token);
        },

        /**
         * 当前token是否是整个SQL结束的终止标志
         * @param token
         * @returns {boolean}
         */
        isSQLEndToken(token) {

            return ("Punctuator" === token.type && ";" === token.value);
        },

        pruningASTNode(ast_node) {

            let disabled_props = globalVariableContainer.config.ast.props.disabled;
            for (let prop of disabled_props) {

                delete ast_node[prop];
            }

            return ast_node;
        },

        generateASTRootNode() {

            return this.pruningASTNode({

                "node": "root",
                "state": "handle",
                "next_state": "statement",
                "next_index": 0,
                "next": [],
            });
        },

        // 生成AST节点
        generateASTNode(node, token, extra) {

            let ast_node = {

                "node": node, // 节点类型 root, statement, clause, expr, word
                "state": extra.state, // 分析时所处状态 root, statement, clause, expr, word 等同于 node
                "next_state": extra.next_state, // 下一个跳转状态 statement, clause, expr, word
                "next_index": 0, // next数组的下标
                "next": [], // next数组, 新增的AST节点根据 next_index push 到目标 next 数组
            };

            if (!tool.isUndefined(token.value)) {
                ast_node.value = token.value;
            }

            if (!this.empty(token)) {
                ast_node.token = token;
            }

            if (!tool.isUndefined(extra.clause)) {
                ast_node.clause = extra.clause;
            }

            if (!tool.isUndefined(extra.expr)) {
                ast_node.expr = extra.expr;
            }

            return this.pruningASTNode(ast_node);
        },

        // 取出第一个有意义有定义的数字
        firstDefinedValue(arr) {

            for (let item of arr) {

                if (item) {

                    return item;
                }
            }

            return "";
        },

        isUndefined(obj) {

            return "undefined" === typeof obj;
        },

        implodeArrByField(arr, field = "value") {

            let str = "";
            for (let item of arr) {

                if ("value" === field && ";" === item['value']) {
                    continue;
                }

                if (!this.isUndefined(item[field])) {
                    str += item[field];
                }
            }

            return str.trim();
        },

        // 从start处开始, 寻找下一个 ch 的
        findNextCh(str, start, ch) {

            let length = str.length;
            for (let i = start; i <= length - 1; ++i) {

                if (ch === str[i]) {

                    return i;
                }
            }

            return -1;
        },

        // 正则匹配
        regTest(pattern, str, error) {

            let reg = new RegExp(pattern);
            if (!reg.test(str)) {

                tool.error(error);
            }

            return true;
        },

        // 表达式中是否含有函数
        isExistFunctionInExpression(expr) {

            let reg = new RegExp(/^[a-zA-Z0-9-_]+\(.*\)$/);
            return reg.test(expr);
        },

        visitAST(ast, visitor) {

            if (!tool.propertyIsObj(ast)) {

                return;
            }

            let properties = Object.getOwnPropertyNames(ast);
            for (let property of properties) {

                // 属性值是数组
                if (Array.isArray(ast[property])) {

                    for (let item of ast[property]) {

                        this.visitAST(item, visitor);
                    }
                }

                // 属性值是对象
                else if (tool.visitAST(ast[property])) {

                    this.visitAST(ast[property], visitor);
                }

                // 属性值是字面值
                else {

                    if (ast[property] && tool.isFunction(ast[property])) {
                        ast[property]();
                    }
                }
            }
        },

        // 语句类型: select, update, delete, insert
        judgeSQLType(sql) {

            let types = ["select", "update", "delete"]; // 暂时不支持insert语句
            let index = types.indexOf(sql.split(" ")[0]);
            if (-1 < index) {

                return types[index];
            }

            throw this.makeErrObj("Unknown Statement", tool.errnoGenerator(), {"sql": sql});
        },

    };

    // 词法分析器
    let scanner = {

        props: {

            stream: "", // 字符流
            length: 0, // 字符流的长度
            seq: 0, // 字符流的序号
            sql_type: "select", // 语句类型
            wordTable: WORD_TABLE,

            // 产物
            tokens: [],
        },

        fsm: {

            state: FSM.SCANNER.STATES.HANDLE, // 当前机器的状态

            events: {

                // 转向Char状态
                flowtoCharState(ch) {

                    let index = scanner.props.tokens.length;
                    scanner.props.tokens.push({
                        "type": (!isNaN(ch) && " " !== ch) ? "Number" : "Punctuator",
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
                },
            }
        },

        init(stream) {

            this.props.stream = stream;

            this.before();
            this.start();
            this.after();
        },

        // 前置处理
        before() {

            if (tool.empty(this.props.stream)) {

                throw tool.makeErrObj("SQL Empty", ERRNO.SUCCESS, {"sql": this.props.stream});
            }

            // 换行符替换为空格
            this.props.stream = $.trim(this.props.stream.replace(/\n/g, " ").toLowerCase());

            // 多个空格替换为1个空格
            this.props.stream = $.trim(this.props.stream.replace(/\s+/g, " ").toLowerCase());

            // 最后添加分号
            this.props.stream = this.props.stream.split(";")[0] + ";";

            // 判断sql类型
            this.props.sql_type = tool.judgeSQLType(this.props.stream);
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

        // 后置处理
        after() {

            // 为符号做匹配处理
            for (let token of this.props.tokens) {

                if ("Punctuator" !== token.type || this.props.wordTable.terminator.punctuator.need_match.indexOf(token.value) < 0) {
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
    };

    // 翻译器
    let translator = {

        props: {

            maze: {},
            meta_sequence: [],
            parsing_result: {

                process: PARSING_PROCESS.FAILURE,
                errno: -1,
                message: "",
                data: {},
            },

            // 模拟寄存器存储数据
            registers: {

                // 累加器
                ax: {

                    "statement": 0,
                    "statement_meta_queue": [],
                    "clause_meta_queue": [],
                    "target_expr_production_queue": [],
                },

                // 堆栈指针寄存器
                sp: {

                    "statement": 0,
                    "clause_name": [],
                    "expr_name": [],
                },

                // 程序状态字
                psw: {

                    "sql_end_f": 0, // SQL结束标志寄存器
                },

                /**
                 * 通过Comparison和Prediction实现word(递归符)之间的解析
                 * word(非递归符)之间的解析根据exploreMaze实现
                 * clause之间的解析根据translateClauseState实现
                 */
                prediction: {

                    "word_next_meta": [], // word后的下一个meta: word(递归符和非递归符) 或 clause
                    "clause_next_meta": [],
                    "expr_next_meta": [],
                },
            },
        },

        core: {

            // 核心步骤
            step: {

                translate(state, token) {

                    let _this = translator;
                    let meta = {"state": state, "token": token}, target_expr_production;
                    let registers = _this.props.registers, ax = registers.ax, sp = registers.sp, psw = registers.psw;
                    _this.props.meta_sequence.push(meta);

                    // 构建 maze
                    let production_name = token.value + "_" + state;
                    if (tool.empty(_this.props.maze)) {

                        // 初始构建 maze
                        _this.props.maze = _this.core.procedure.buildMaze(meta);

                    } else if (_this.isSelectStatementProduction(production_name)) {

                        // 追加构建 maze
                        _this.props.maze = _this.core.procedure.buildMazeAppended(meta, _this.props.maze);
                    }

                    // 根据当前的状态解析
                    let res = PARSING_PROCESS.FAILURE, statement_th, clause_meta_queue, clause_name, expr_name;
                    switch (state) {

                        case "statement":

                            ++ax.statement; // statement个数+1
                            ++sp.statement; // 当前所在的statement
                            ax.statement_meta_queue.push(meta);

                            statement_th = _this.getStatementTh();
                            res = this.translateStatementState(production_name, _this.props.maze, statement_th);
                            break;

                        case "clause":

                            statement_th = _this.getStatementTh();
                            clause_meta_queue = tool.pureValueAssign(ax.clause_meta_queue);
                            if (!clause_meta_queue[statement_th - 1]) {
                                clause_meta_queue[statement_th - 1] = [];
                            }
                            clause_meta_queue[statement_th - 1].push(meta);
                            ax.clause_meta_queue = clause_meta_queue;
                            sp.clause_name[statement_th - 1] = production_name;

                            res = this.translateClauseState(production_name, _this.props.maze, statement_th);
                            break;

                        case "expr":

                            statement_th = _this.getStatementTh();
                            clause_name = sp.clause_name[statement_th - 1];
                            sp.expr_name[statement_th - 1] = expr_name = production_name;

                            res = this.translateExprState(statement_th, clause_name, expr_name, meta);
                            break;

                        case "word":
                        default:

                            // 如果当前token是子查询的终止token
                            if (tool.isSubqueryEndToken(token)) {

                                --sp.statement;
                            }

                            if (tool.isSQLEndToken(token)) {

                                psw.sql_end_f = 1;
                            }

                            if (!_this.isIgnoreToken(token)) {

                                statement_th = _this.getStatementTh();
                                target_expr_production = tool.pureValueAssign(
                                    ax.target_expr_production_queue[statement_th - 1]
                                );
                                expr_name = sp.expr_name[statement_th - 1];
                                res = this.translateWordState(expr_name, target_expr_production, meta);
                            } else {
                                res = PARSING_PROCESS.SUCCESS;
                            }
                            break;
                    }

                    // 解析结果
                    if (PARSING_PROCESS.SUCCESS !== res) {

                        // 解析失败
                        throw tool.makeErrObj(_this.props.parsing_result.message, tool.errnoGenerator(), _this.props.parsing_result);
                    }
                },

                translateStatementState(production_name, production, statement_th) {

                    let res = PARSING_PROCESS.FAILURE, _this = translator, res_or_production;
                    if (1 === statement_th && production_name === production.production_name) {

                        res = PARSING_PROCESS.SUCCESS;
                    } else if (1 < statement_th) {

                        let meta = {"state": "statement", "token": {"type": "Keyword", "value": "select"}},
                            target_expr_production = _this.props.registers.ax.target_expr_production_queue[statement_th - 2]; // -2是上一个的下标
                        res = res_or_production = _this.core.procedure.exploreMazeDFS(target_expr_production.production_name, target_expr_production, meta);
                        _this.reAssignTargetExprProduction(res_or_production, statement_th - 2);
                        res = res_or_production ? PARSING_PROCESS.SUCCESS : PARSING_PROCESS.FAILURE;
                    }

                    return res;
                },

                translateClauseState(production_name, production, statement_th) {

                    let i = 1;
                    production = translator.findNStatementProduction(production, statement_th);

                    let res = PARSING_PROCESS.FAILURE, message;
                    let items = production.construct[0];
                    for (i = 0; i <= items.length - 1; ++i) {

                        let item = items[i];
                        if (item.lock) {
                            continue;
                        }
                        if (item.reference_name === production_name) {

                            item.lock = true;
                            res = PARSING_PROCESS.SUCCESS;
                            break;
                        } else if (item.must) {

                            message = "'" + production_name + "' must exit";
                            break;
                        } else {

                            message = "'" + production_name + "' not matched";
                        }

                        translator.props.parsing_result = {
                            process: PARSING_PROCESS.FAILURE,
                            errno: -1,
                            message: message,
                            data: item,
                        };
                    }

                    return res;
                },

                translateExprState(statement_th, clause_name, expr_name, meta) {

                    let _this = translator;
                    let res = PARSING_PROCESS.FAILURE;

                    // 掐头去尾得到目标production, 后续的translateWord操作会使用这里生成的target_expr_production
                    let production = _this.props.maze;
                    let target_expr_production = _this.findTargetExprProduction(production, statement_th, clause_name, expr_name);
                    if (target_expr_production) {

                        _this.props.registers.ax.target_expr_production_queue[statement_th - 1] = target_expr_production;
                        res = PARSING_PROCESS.SUCCESS;
                    }

                    let prediction = "word_next_meta";
                    _this.core.procedure.nextMetaPrediction(statement_th, prediction, {"state": "word"}, {"is_recursive_word": false});
                    return res;
                },

                translateWordState(production_name, production, meta) {

                    let _this = translator, statement_th;
                    let res = PARSING_PROCESS.FAILURE, res_or_production;

                    if (_this.props.registers.psw.sql_end_f) {

                        res = _this.core.procedure.recallExploreMaze();
                    } else {

                        // 因为在explore的同时, 会记录strategy, 所以需要重新赋给target_expr_production
                        statement_th = _this.getStatementTh();
                        res = res_or_production = _this.core.procedure.exploreMazeDFS(production_name, production, meta);
                        _this.reAssignTargetExprProduction(res_or_production, statement_th - 1);
                    }

                    return res ? PARSING_PROCESS.SUCCESS : PARSING_PROCESS.FAILURE
                },
            },

            // 核心过程
            procedure: {

                // 初始构建maze
                buildMaze(meta) {

                    let _this = translator;
                    let structure = _this.getStatementGrammarStructure(meta);
                    let production_name = meta.token.value + "_" + meta.state;
                    _this.props.maze = tool.pureValueAssign(structure);
                    return _this.spreadProduction(production_name, _this.props.maze, 0);
                },

                // 追加构建maze
                buildMazeAppended(meta, production) {

                    if (!production || !production.construct || !Array.isArray(production.construct)) {
                        return production;
                    }

                    let _this = translator;
                    production.construct.map((rule) => {

                        rule = rule.map((item) => {

                            let production_name = item.reference_name;
                            if (_this.isLeadToNextMazeProduction(production_name)) {

                                item.link = this.buildMazeAppended(meta, item.link);
                            } else if (_this.isLinkNextMazeProduction(production_name)) {

                                if (item.link) {

                                    // 继续往下走
                                    item.link = this.buildMazeAppended(meta, item.link);
                                } else {

                                    // 追加
                                    item.link = _this.spreadProduction(production_name, _this.getStatementGrammarStructure(meta), production.deep + 1);
                                }
                            }

                            return item;
                        });

                        return rule;
                    });

                    return production;
                },

                /**
                 * parsingExprWords: 解析永远解析的是token, 非终结符的link仅引导走向下一个节点 ！
                 * @param production_name
                 * @param production
                 * @param meta
                 * @returns {production|boolean}
                 */
                exploreMazeDFS(production_name, production, meta) {

                    let _this = translator;
                    if (!production || !production.construct || !Array.isArray(production.construct)) {

                        return false;
                    }
                    if (production_name !== production.production_name) {

                        throw tool.makeErrObj("production name not matched", tool.errnoGenerator(), production);
                    }

                    // 循环产生式的每一个规则
                    let res = PARSING_PROCESS.FAILURE;
                    for (let rule_index in production.construct) {

                        if (!production.construct.hasOwnProperty(rule_index)) {
                            continue;
                        }

                        // 定义items相关数据
                        let items = production.construct[rule_index], items_length = items.length;
                        let items_require = _this.fetchRequire(production, rule_index);

                        // 训练require, 自动获取所有的数据, 为循环items服务
                        let train_info = _this.trainRequire(rule_index, items_require, items, production.strategy);
                        let start = train_info.start, end = train_info.end;

                        // 循环此规则下的items
                        for (let j = start; j <= end; ++j) {

                            // 先比对, 后预测
                            let statement_th = translator.getStatementTh(), prediction_key = "word_next_meta",
                                prediction_meta = _this.props.registers.prediction[prediction_key][statement_th - 1];
                            _this.core.procedure.nextMetaComparison(
                                statement_th, prediction_key, meta,
                                {"items_require": items_require}
                            );
                            if (items_require.item_recursive && prediction_meta.is_recursive_word && _this.isItemRecursiveToken(items_require.item_recursive, meta)) {
                                continue;
                            }

                            // items[j] maybe not exist
                            let item = items[j], item_parsing_res = _this.itemParsing(item, meta);
                            if (item_parsing_res) {

                                res = PARSING_PROCESS.SUCCESS;
                                production = _this.reAssignStrategy(production, rule_index, j, item, items_require);
                            } else {

                                // 阶段性解析错误
                                _this.props.parsing_result = {
                                    process: PARSING_PROCESS.FAILURE,
                                    errno: -1,
                                    message: "'" + meta.token.value + "'" + " not matched",
                                };
                            }

                            // 如果items是有序的, 则无论是否解决成功, 都需要提前返回
                            if (!items_require.item_recursive) {

                                break;
                            }
                        }

                    }

                    return (PARSING_PROCESS.SUCCESS === res) ? production : false;
                },

                /**
                 * 回溯遍历
                 * @returns {boolean}
                 */
                recallExploreMaze() {

                    let statement_th = 1, _this = translator, production = _this.props.maze;
                    while (statement_th <= _this.props.registers.ax.statement) {

                        let items = production.construct[0];

                        for (let i = 0; i <= items.length - 1; ++i) {

                            if (items[i].must && !items[i].lock) {

                                _this.props.parsing_result = {
                                    process: PARSING_PROCESS.FAILURE,
                                    errno: -1,
                                    message: "Excepted '" + items[i].reference_name + "'" + "",
                                    data: items[i],
                                };
                                return false;
                            }
                        }

                        ++statement_th;
                        if (statement_th <= _this.props.registers.ax.statement) {
                            production = _this.findNStatementProduction(production, statement_th);
                        }
                    }

                    return true;
                },

                // 把当前的meat与之前预测的对下一个meta做对比, 错误则直接抛异常
                nextMetaComparison(statement_th, prediction_key, meta, extra = {}) {

                    let _this = translator,
                        prediction_meta = _this.props.registers.prediction[prediction_key][statement_th - 1];

                    switch (meta.state) {

                        case "word":
                            let items_require = extra.items_require;
                            if (prediction_meta.state !== meta.state) {

                                throw tool.makeErrObj("nextMetaComparison failed", tool.errnoGenerator(),
                                    {"prediction_meta": prediction_meta, "meta": meta}
                                );
                            }
                            if (items_require.item_recursive && meta.is_recursive_word && !_this.isItemRecursiveToken(items_require.item_recursive, meta)) {

                                throw tool.makeErrObj("nextMetaComparison failed with not recursive", tool.errnoGenerator(),
                                    {"prediction_meta": prediction_meta, "meta": meta}
                                );
                            }
                            if (items_require.item_recursive && !meta.is_recursive_word && _this.isItemRecursiveToken(items_require.item_recursive, meta)) {

                                throw tool.makeErrObj("nextMetaComparison failed with could not recursive", tool.errnoGenerator(),
                                    {"prediction_meta": prediction_meta, "meta": meta}
                                );
                            }

                            break;

                        case "expr":
                            break;

                        case "clause":
                            break;

                        case "statement":
                            break;

                        default:
                            break;
                    }
                },

                // 预测下个meta
                nextMetaPrediction(statement_th, prediction_key, meta, extra = {}) {

                    let _this = translator;

                    switch (meta.state) {

                        case "word":
                            meta = Object.assign(meta, extra);
                            break;

                        case "expr":
                            break;

                        case "clause":
                            break;

                        case "statement":
                            break;

                        default:
                            break;
                    }

                    _this.props.registers.prediction[prediction_key][statement_th - 1] = meta;
                },
            },
        },

        // 获取默认约束
        getDefaultRequire() {

            return {

                // 不再使用返回默认字段这种方式, 必须手动配置, 不配置则作为无效处理
                // "item_count": 0,
                // "item_recursive": "",
            };
        },

        // 获取默认选项
        getDefaultOption() {

            return {

                // "must": false, 因为clause是引导子句, clause存在expr存在, expr存在则word存在, 则所以只有 clause 才需要有 must 选项, must选项也仅对clause起作用
            };
        },

        // 获取statement语法结构
        getStatementGrammarStructure(meta) {

            let statement = meta.token.value + "_statement";
            let language = globalVariableContainer.config.grammar.language;

            return tool.pureValueAssign(grammar[language]["statement"][statement]);
        },

        getStatementTh() {

            return this.props.registers.sp.statement;
        },

        getLastNotEmptyMeta() {

            for (let i = this.props.meta_sequence.length - 2; i >= 0; --i) {

                let meta = this.props.meta_sequence[i];
                if (" " === meta.token.value) {
                    return meta;
                }
            }
            return false;
        },

        // 是否是终结符
        isTerminator(item) {

            return typeof (item && item.reference && item.reference_name) === "undefined";
        },

        // 是否可以忽略此Token
        isIgnoreToken(token) {

            return (-1 < [" "].indexOf(token.value));
        },

        // 是否是statement产生式
        isStatementProduction(production_name) {

            return production_name.indexOf("statement") > -1;
        },

        // 是否是select查询产生式
        isSelectStatementProduction(production_name) {
            return "select_statement" === production_name;
        },

        // 是否是from子句产生式
        isFromClauseProduction(production_name) {
            return "from_clause" === production_name;
        },

        // 是否是from表达式产生式
        isFromExprProduction(production_name) {
            return "from_expr" === production_name;
        },

        // 是否是子查询产生式
        isSubqueryExpr(production_name) {
            return "subquery_expr" === production_name;
        },

        // 是否为通往下一个maze的道路/产生式
        isLeadToNextMazeProduction(production_name) {

            if (this.isFromClauseProduction(production_name)) {
                return true;
            }

            if (this.isFromExprProduction(production_name)) {
                return true;
            }

            if (this.isSubqueryExpr(production_name)) {
                return true;
            }

            return false;
        },

        // 是否为连接下一个maze的道路节点处/产生式
        isLinkNextMazeProduction(production_name) {

            return this.isSelectStatementProduction(production_name);
        },

        // require 是否存在子规则
        isRequireHasSubRule(production) {

            return (!production.require || !production.require.rule_1) ? 0 : 1;
        },

        // 获取约束
        fetchRequire(production, rule_index = 0) {

            if (!this.isRequireHasSubRule(production)) {

                return production.require;
            }

            if (production.require["rule_" + rule_index]) {

                return production.require["rule_" + rule_index];
            }

            throw this.makeErrObj("rule_index error for production", tool.errnoGenerator(), {"production": production});
        },

        findNStatementProduction(production, statement_th) {

            let i = 1;
            while (i <= statement_th) {

                if (statement_th === i) {

                    break;
                }

                // 如果statement_th>1, 则一定是子查询
                ++i;
                production = production.construct[0][1].link.construct[0][0].link.construct[1][0].link.construct[0][1].link; // 不要值传递, 否则无法起到改变原值的效果
            }

            return production ? production : false;
        },

        findTargetExprProduction(production, statement_th, clause_name, expr_name) {

            production = this.findNStatementProduction(production, statement_th);
            for (let rule of production.construct) {

                for (let item of rule) {

                    if (clause_name === item.reference_name) {

                        return item.link.construct[0][0].link;
                    }
                }
            }

            return false;
        },

        reAssignTargetExprProduction(res_or_production, th) {

            if (res_or_production) {

                this.props.registers.ax.target_expr_production_queue[th] = res_or_production;
            }
        },

        reAssignStrategy(production, rule_index, item_index, item, items_require) {

            if (this.isTerminator(item) && !items_require.item_recursive) {
                production.strategy[rule_index].push(item_index);
            }
            if ("select_statement" === item.reference_name && !items_require.item_recursive) {
                production.strategy[rule_index].push(item_index);
            }

            let extra, statement_th = this.getStatementTh(), meta = this.props.meta_sequence.last();
            if (item_index >= production.construct[rule_index].length - 1) {

                production.strategy[rule_index] = [];
                extra = {"is_recursive_word": true}; // 下一个可以是递归符
            } else {

                extra = {"is_recursive_word": false};
            }
            this.core.procedure.nextMetaPrediction(statement_th, "word_next_meta", meta, extra);

            return production;
        },

        pruningProduction(production_name, production, extra) {

            let state = production_name.split("_")[1];
            let disabled_props = globalVariableContainer.config.production.props.disabled;

            if (0 > disabled_props.indexOf("deep") && !tool.isUndefined(extra.deep)) {
                production.deep = extra.deep;
            }

            if (0 > disabled_props.indexOf("statement_th") && !tool.isUndefined(extra.statement_th)) {
                production.statement_th = extra.statement_th;
            }

            if ("clause" === state) {
                production.lock = false;
            }

            production.production_name = production_name;
            production.strategy = tool.newNArray(production.construct.length);

            return production;
        },

        // 为产生式生成约束
        createRequire(production_name, production) {

            if (this.isRequireHasSubRule(production)) {

                let count = production.construct.length;
                for (let i = 0; i <= count - 1; ++i) {

                    let rule_i = "rule_" + i;
                    if (production.require.hasOwnProperty(rule_i)) {

                        production.require[rule_i] = Object.assign(this.getDefaultRequire(), production.require[rule_i]);
                    } else {

                        throw tool.makeErrObj(production_name + " require has no " + rule_i, tool.errnoGenerator(), {"production": production});
                    }
                }
            } else if (production.require) {

                production.require = Object.assign(this.getDefaultRequire(), production.require);
            }

            return production.require;
        },

        // 推导出新的产生式
        inferProduction(reference, reference_name) {

            // 使用 Object.assign 也不能完全值引用, 所以使用 JSON
            let temp_grammar = JSON.parse(JSON.stringify(grammar));
            return temp_grammar.closure[reference][reference_name];
        },

        // 根据产生式名展开产生式 (产生式:production)
        spreadProduction(production_name, production, deep) {

            // 终止点
            if (!production || !production.construct || !Array.isArray(production.construct)) {
                return production;
            }

            // 循环产生式的每一个规则
            production.construct = production.construct.map((rule) => {

                // 循环规则内的每一项单元
                rule = rule.map((item) => {

                    // 如果是非终结符且不是 select_statement production 则继续展开
                    if (!this.isTerminator(item) && !this.isSelectStatementProduction(item.reference_name)) {

                        // 根据 reference, reference_name 来推出产生式
                        let infer_production = this.inferProduction(item.reference, item.reference_name);
                        infer_production = this.spreadProduction(item.reference_name, infer_production, deep + 1);

                        return {
                            ...Object.assign(this.getDefaultOption(), item),
                            link: infer_production,
                        };
                    }

                    return item;
                });

                return rule;
            });

            let extra = {"deep": deep};
            if (this.isStatementProduction(production_name)) {
                extra.statement_th = this.props.registers.sp.statement + 1;
            }
            production = this.pruningProduction(production_name, production, extra);
            production.require = this.createRequire(production_name, production);

            return production;
        },

        // token是否是item_recursive
        isItemRecursiveToken(item_recursive, meta) {

            let pieces = item_recursive.split(".");
            let production = tool.pureValueAssign(grammar.closure[pieces[0]][pieces[1]]);
            let item = production.construct[0][0];

            return this.terminatorMatchingStrictly(item, meta);
        },

        terminatorMatching(item, meta) {

            return item.type.toLowerCase() === meta.token.type.toLowerCase();
        },

        terminatorMatchingStrictly(item, meta){

            return (meta.token.type === item.type && meta.token.value === item.value);
        },

        /**
         * 解析终结符
         * @param item
         * @param meta
         * @returns {boolean}
         */
        itemParsing(item, meta) {

            let item_parsing_res = false;
            if (!item) {
                return item_parsing_res;
            }
            if (this.isTerminator(item)) {

                // 终结符的匹配结果
                if (item.value) {

                    item_parsing_res = this.terminatorMatchingStrictly(item, meta);
                } else {

                    item_parsing_res = this.terminatorMatching(item, meta);
                }
            } else {

                // 非终结符的匹配结果
                if ("select_statement" === item.reference_name) {

                    item_parsing_res = true;
                } else {

                    item_parsing_res = this.core.procedure.exploreMazeDFS(item.link.production_name, item.link, meta);
                    if (item_parsing_res) {
                        item_parsing_res = true;
                    }
                }
            }

            return item_parsing_res;
        },

        // 训练产生式约束
        trainRequire(rule_index, require, items, strategy) {

            rule_index = parseInt(rule_index);
            let items_length = items.length;
            let start = 0, end = items_length - 1;
            if (!require.item_recursive) {

                let last_item_index = strategy[rule_index].last(1);
                if (-1 === last_item_index) {
                    start = 0;
                    end = -1;
                } else if (false === last_item_index) {
                    start = 0;
                } else {
                    end = start = last_item_index + 1;
                }
            }

            return {

                "start": start,
                "end": end,
            };
        },
    };

    // AST构建器
    let builder = {

        props: {

            tokens: [], // token流
            wordTable: WORD_TABLE,
            nesting_queries: [], // 记录下嵌套查询的信息 {"query":"", "left_bracket_index":10, "right_bracket_index":10"}

            // 产物
            ast: {},
        },

        fsm: {

            state: FSM.PARSER.STATES.HANDLE,

            events: {

                // 转向Word状态
                flowtoWordState(token) {

                    let word = token.value;
                    if (builder.props.wordTable.sequence.keyword.statement.indexOf(word) > -1) {

                        builder.fsm.state = FSM.PARSER.STATES.STATEMENT;
                        return;
                    } else if (builder.props.wordTable.sequence.keyword.clause.indexOf(word) > -1) {

                        builder.fsm.state = FSM.PARSER.STATES.CLAUSE;
                        return;
                    }

                    let root = builder.props.ast;
                    let statement_node = root.next[root.next_index];
                    if (statement_node.next_index >= statement_node.next.length) {

                        statement_node.next.push(tool.generateASTNode("clause", {}, {
                            "state": "clause",
                            "next_state": "word",
                            "clause": statement_node.value, // 不存在token, 则用clause作为标识字段
                        }));

                        let last_node_token = statement_node.token;
                        translator.core.step.translate("clause", last_node_token);
                    }

                    let clause_node = statement_node.next[statement_node.next_index];
                    if (clause_node.next_index >= clause_node.next.length) {

                        clause_node.next.push(tool.generateASTNode("expr", {}, {
                            "state": "expr",
                            "next_state": "word",
                            "expr": tool.firstDefinedValue([clause_node.value, clause_node.clause, statement_node.value]), // 不存在token, 则用expr作为标识字段
                        }));

                        let last_node_token = tool.firstDefinedValue([clause_node.token, statement_node.token]);
                        translator.core.step.translate("expr", last_node_token);
                    }
                    clause_node.next_index = clause_node.next.length - 1;

                    let expr_node = clause_node.next[clause_node.next_index];
                    expr_node.next.push(tool.generateASTNode("word", token, {
                        "state": "word",
                        "next_state": "handle",
                    }));
                    expr_node.next_index = expr_node.next.length - 1;

                    translator.core.step.translate("word", token);

                    builder.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向expr状态
                flowtoExprState(token) {

                    let root = builder.props.ast;
                    let statement_node = root.next[root.next_index];
                    let clause_node = statement_node.next[statement_node.next_index];

                    clause_node.next.push(tool.generateASTNode("expr", token, {
                        "state": "expr",
                        "next_state": "handle",
                    }));
                    clause_node.next_index = clause_node.next.length - 1;

                    translator.core.step.translate("expr", token);

                    builder.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向clause状态
                flowtoClauseState(token) {

                    let root = builder.props.ast;
                    let statement_node = root.next[root.next_index];
                    statement_node.next.push(tool.generateASTNode("clause", token, {
                        "state": "clause",
                        "next_state": "handle",
                    }));
                    statement_node.next_index = statement_node.next.length - 1;

                    translator.core.step.translate("clause", token);

                    builder.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向STATEMENT状态
                flowtoStatementState(token) {

                    let root = builder.props.ast;
                    root.next.push(tool.generateASTNode("statement", token, {
                        "state": "statement",
                        "next_state": "handle",
                    }));
                    root.next_index = root.next.length - 1;

                    translator.core.step.translate("statement", token);

                    builder.fsm.state = FSM.PARSER.STATES.HANDLE;
                }
            },
        },

        init() {

            this.before();
            this.start();
            this.after();
        },

        before() {

            this.props.tokens = scanner.props.tokens;

            // 先对括号进行子查询匹配处理
            let token_length = this.props.tokens.length;
            for (let token of this.props.tokens) {

                if ("(" === token.value) {

                    for (let i = token.index + 1; i <= token_length - 1; ++i) {

                        if ("select" === this.props.tokens[i].value && token.match_index > i) {

                            let right_token = this.props.tokens[token.match_index];
                            let right_bracket_seq = right_token.seq;
                            this.props.nesting_queries.push({
                                "query": scanner.props.stream.slice(token.seq, right_bracket_seq - 1),
                                "left_bracket_token": token,
                                "left_bracket_index": token.index,
                                "left_bracket_seq": token.seq,

                                "right_bracket_token": right_token,
                                "right_bracket_index": token.match_index,
                                "right_bracket_seq": right_bracket_seq,
                            });
                            break;
                        }
                    }
                }
            }
        },

        start() {

            // 状态机模型分析tokens
            for (let token of this.props.tokens) {

                // token先流向词状态, 由词状态内部去抉择下一个状态是什么, 并返回创建的这个词节点
                this.fsm.events.flowtoWordState(token);

                // 如果不属于平衡状态(HANDLE状态), 则循环运行下去直到平衡为止
                while (FSM.PARSER.STATES.HANDLE !== this.fsm.state) {

                    switch (this.fsm.state) {
                        case FSM.PARSER.STATES.STATEMENT:
                            this.fsm.events.flowtoStatementState(token);
                            break;
                        case FSM.PARSER.STATES.CLAUSE:
                            this.fsm.events.flowtoClauseState(token);
                            break;
                        case FSM.PARSER.STATES.EXPR:
                            this.fsm.events.flowtoExprState(token);
                            break;
                        case FSM.PARSER.STATES.WORD:
                            this.fsm.events.flowtoWordState(token);
                            break;
                        default:
                            break;
                    }
                }
            }
        },

        after() {

            this.optimize();
        },

        optimize() {

            // 对子查询的AST结构进行调整
            for (let token of this.props.tokens) {

            }
        },
    };

    // 前端过程控制器
    let controller = {

        registers: {

            // 注册AOP
            registerAOP() {

                Function.prototype.before = function (func) {

                    let _self = this;
                    return function () {

                        if (false === func.apply(this, arguments)) {
                            return false;
                        }
                        return _self.apply(this, arguments);
                    };
                };

                Function.prototype.after = function (func) {

                    let _self = this;
                    return function () {

                        let ret = _self.apply(this, arguments);
                        if (false === ret) {
                            return false;
                        }
                        func.apply(this, arguments);
                        return ret;
                    };
                };
            },

            // 注册扩展
            registerExtension() {

                Array.prototype.last = function (index, throw_e = false) {

                    if (tool.isUndefined(arguments[0])) {
                        index = 1;
                    }
                    if (true === index) {

                        index = 1;
                        throw_e = true;
                    }
                    let start = (this.length - 1) - index + 1;
                    if (!tool.isUndefined(this[start])) {
                        return this[start];
                    }

                    if (throw_e) {
                        throw tool.makeErrObj("function last with index overflow", tool.errnoGenerator(), {
                            "index": index,
                            "array": this
                        });
                    }
                    return false;
                }
            },
        },

        cleaners: {

            propsCleaning() {

                // Scanner clean
                WORD_TABLE.sequence.keyword.any = (() => {

                    return WORD_TABLE.sequence.keyword.statement.concat(
                        WORD_TABLE.sequence.keyword.clause,
                        WORD_TABLE.sequence.keyword.other,
                        WORD_TABLE.sequence.keyword.function
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
                if (tool.isUndefined(scanner.props_backup)) {
                    scanner.props_backup = tool.pureValueAssign(scanner.props);
                } else {
                    scanner.props = tool.pureValueAssign(scanner.props_backup);
                }
                scanner.props.wordTable = WORD_TABLE;

                // Builder clean
                if (tool.isUndefined(builder.props_backup)) {
                    builder.props.ast = tool.generateASTRootNode();
                    builder.props_backup = tool.pureValueAssign(builder.props);
                } else {
                    builder.props = tool.pureValueAssign(builder.props_backup);
                }

                // Translator clean
                if (tool.isUndefined(translator.props_backup)) {
                    translator.props_backup = tool.pureValueAssign(translator.props);
                } else {
                    translator.props = tool.pureValueAssign(translator.props_backup);
                }
            }
        },

        init() {

            this.before();
            this.start();
        },

        before() {

            this.registers.registerAOP();
            this.registers.registerExtension();
            this.cleaners.propsCleaning();
        },

        start() {

            this.lexicalAnalysis.work();
            this.syntacticAnalysis.work();
            this.semanticAnalysis.work();
        },

        // 词法分析
        lexicalAnalysis: {

            work() {

                scanner.init(globalVariableContainer.config.sql);
            }
        },

        // 语法分析
        syntacticAnalysis: {

            work() {

                builder.init();
            }
        },

        // 语义分析
        semanticAnalysis: {

            work() {

            }
        }
    };

    // 自动化测试
    let testing = {

        props: {},

        core: {

            mock: {

                // 从Grammar文件切入, BFS遍历Grammar, 自动生成完整的SQL用例
                mockSQLInGrammarBFS() {


                },
            },
        },

        start() {

        },
    };

    // 定义 SQLCompiler
    let SQLCompiler = function (config = {}) {

        globalVariableContainer.config = Object.assign({
            sql: "",
            debug: true,
            log_n: 1, // 打印日志序号从n开始
            parsing_enable: true, // 是否启用语法解析
            ast: {

                props: {

                    disabled: ["state", "next_state"],
                },
            },
            production: {

                props: {

                    disabled: ["deep"],
                },
            },
            grammar: {

                // 配置使用的语法类型
                language: "mysql",
            },
        }, config);
    };
    SQLCompiler.prototype = {

        tool: tool,
        scanner: scanner,
        translator: translator,
        builder: builder,
        controller: controller,

        boot() {

            this.controller.init();
        },
    };

    // 扩展 SQLCompiler 功能
    $.fn.extend({

        SQLCompilerAPI: {

            // 闭包, 对外访问接口
            closure: {

                tool: tool,
                scanner: scanner,
                translator: translator,
                builder: builder,
                controller: controller,
            },

            // 自动化测试
            testing() {

                return testing.start();
            },

            format() {

                let sql = "";
                let lines = 0; // 记录当前的行数
                let statement = 0;
                let clause_indents = 0; // 记录当前的clause缩进
                let statement_indents = 0; // 记录当前的语句缩进

                let indent_str = ""; // 缩进字符
                let enter_str = ""; // 换行字符

                let nesting_queries = builder.props.nesting_queries;

                function reset() {

                    statement = 0;
                    clause_indents = 0;
                    statement_indents = 0;
                    indent_str = "";
                    enter_str = "";
                }

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

                                if ("statement" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    // 语句缩进, 当前是第n个句子, 缩进就是n*8, 之所以不乘4是因为4是从句的缩进
                                    statement_indents = statement * 8;

                                    enter_str = tool.makeContinuousStr(lines === 0 ? 0 : 1, "\n");
                                    indent_str = tool.makeContinuousStr(statement_indents, " ");
                                    sql += (enter_str + indent_str + obj['value'].toUpperCase());

                                    ++lines;
                                    ++statement;
                                } else if ("clause" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    clause_indents = statement_indents + 4; // 从句缩进 = 句子缩进 + 4
                                    if ("union" === obj['value']) {
                                        reset();
                                    }

                                    indent_str = tool.makeContinuousStr(clause_indents, " ");
                                    enter_str = tool.makeContinuousStr(1, "\n");
                                    sql += (enter_str + indent_str + obj['value'].toUpperCase());

                                    ++lines;
                                } else if (("expr" === obj[property] || "word" === obj[property]) && !tool.isUndefined(obj['value'])) {

                                    let val = obj['value'];

                                    // 如果是右括号, 则判断是否为子查询的右括号
                                    if (")" === val) {

                                        // 是子查询的右括号
                                        for (let i = 0; i <= nesting_queries.length - 1; ++i) {

                                            if (obj.token.index === nesting_queries[i].right_bracket_index) {

                                                // 子查询缩进为 (i+1)*4, 之所以i+1是因为全部的子查询是存在nesting_queries数组中的
                                                // 第一个子查询的 i 为 0, 所以需要 +1, 以表示这是第1个子查询
                                                // 乘4是因为右括号需要和from并列, from是从句, 其缩进为每次缩进4
                                                // i*4是因为子查询SELECT间的缩进
                                                let sub_query_indents = (statement - 2) * 8 + 4;

                                                indent_str = tool.makeContinuousStr(sub_query_indents, " ");
                                                enter_str = tool.makeContinuousStr(1, "\n");
                                                sql += (enter_str + indent_str + val);

                                                ++lines;
                                                --statement;
                                                return;
                                            }
                                        }

                                        // 不是子查询的右括号
                                        sql += val;
                                    }

                                    // 如果是关键字
                                    else if (scanner.props.wordTable.sequence.keyword.any.indexOf(val) > -1) {
                                        val = val.toUpperCase();
                                        sql += val;
                                    }

                                    // 普通字符
                                    else {

                                        sql += val;
                                    }
                                }
                            }
                        }
                    }
                }

                traverseObj(builder.props.ast);

                let res = {
                    sql: sql,
                    lines: lines,
                };

                return res;
            },

            visitAST() {

            },
        },

        SQLCompiler: function (config = {sql: ""}) {

            return $(this).each(function () {

                try {

                    (new SQLCompiler(config)).boot();

                } catch (e) {

                    tool.recoverErrObj(e);
                }
            });
        },
    });

})();