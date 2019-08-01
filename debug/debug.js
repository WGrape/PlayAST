// 注册前置处理
Function.prototype.after = function (after_fn) {

    let _self = this;

    return function () {

        _self.call(_self, arguments);
        after_fn.call(this, arguments);
    }
};

// 注册后置处理
Function.prototype.before = function (before_fn) {

    let _self = this;

    return function () {

        before_fn.call(this, arguments);
        _self.call(_self, arguments);
    }
};

function consoleShowAST(sql_review_obj) {

    // 开始编译, 并清空控制台
    console.clear();

    console.log("\n%c 第 1 阶段, 词法分析 :", 'color:#FF9800;');
    console.log("\n%c sql_cleared 如下:", 'color:green;');
    console.log(sql_review_obj.SQLCompilerAPI.steps.lexicalAnalysis.getSQLCleared());

    console.log("\n%c 分词数组 如下:", 'color:green;');
    console.log(sql_review_obj.SQLCompilerAPI.steps.lexicalAnalysis.getSQLDemarcated());

    console.log("\n%c Token Table 如下:", 'color:green;');
    console.log(sql_review_obj.SQLCompilerAPI.steps.lexicalAnalysis.getTokenTable());

    console.log("\n%c 第 2 阶段, 语法分析 :", 'color:#FF9800;');
    console.log("\n%c statement_type 为 : " + sql_review_obj.SQLCompilerAPI.steps.syntacticAnalysis.getStatementType(), 'color:green;');

    console.log("\n%c AST Outline 如下:", 'color:green;');
    console.log(sql_review_obj.SQLCompilerAPI.steps.syntacticAnalysis.getASTOutline());

    console.log("\n%c AST Outline Pruned 如下:", 'color:green;');

    let result = sql_review_obj.SQLCompilerAPI.steps.syntacticAnalysis.getASTOutlinePruned();
    console.log(result);
}


// compiler.lexicalAnalysis.clear.before(debugMsg)("开始语法分析(lexicalAnalysis) ...");
