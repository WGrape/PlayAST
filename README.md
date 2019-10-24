# PlayAST
PlayAST : 抽象语法树的设计与实现 ( PlayAST : Play With Abstract Syntax Tree )

## 介绍
学习 [AST](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9) 原理并实现

## 原理
编译原理中，前端过程主要内部处理分为 [词法分析](https://zh.wikipedia.org/wiki/%E8%AF%8D%E6%B3%95%E5%88%86%E6%9E%90) , [语法分析](https://zh.wikipedia.org/zh-hans/%E8%AA%9E%E6%B3%95%E5%88%86%E6%9E%90%E5%99%A8) 和 [语义分析](https://en.wikipedia.org/wiki/Semantic_analysis)。在语法分析阶段中会生成AST。

<img src="./extra/images/introduce.png" width="700px">

## 作用
通过AST可以对任何具有语法的代码实现任何解析，从而达到处理目标。其常见作用如下：
- 优化语句，如实现对代码的优化
- 编写针对特定语法的编译器
- 实现对代码的语法检查
- 实现对代码的格式化处理

## 实现

### 1. SQL AST
JS实现对SQL的语法分析

#### V2.0
对 V1.0 的完全重构版本，代码在 ```src/sql/v2.0```中

#### V1.0
最初始的SQL语法分析版本，分析架构太差，在分析过程中使用的判断过多，且分析过程不合理，故选择在V2版本中重构

## 参考
[详见资料学习参考](./extra/docs/reference.md)




