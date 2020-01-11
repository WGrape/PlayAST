# PlayAST
PlayAST : 抽象语法树的设计与实现 ( PlayAST : Play With Abstract Syntax Tree )

## 介绍
学习 [AST](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9) 原理并实现

## 原理
编译原理中，前端过程主要内部处理分为 [词法分析](https://zh.wikipedia.org/wiki/%E8%AF%8D%E6%B3%95%E5%88%86%E6%9E%90) , [语法分析](https://zh.wikipedia.org/zh-hans/%E8%AA%9E%E6%B3%95%E5%88%86%E6%9E%90%E5%99%A8) 和 [语义分析](https://en.wikipedia.org/wiki/Semantic_analysis)。其中在语法分析阶段会生成并维护一例**类似于树结构的语法模型AST**，用于抽象具有语法规则的语句，从而实现语句到数据结构的映射，实现前端过程的工作目标「分析」。

## 作用
通过AST可以实现对任何具有语法规则的代码分析，以实现处理目标。其常见作用如下：
- 优化语句代码
- 实现对代码的语法检查
- 实现对代码的格式化处理
- 编写针对特定语法的分析器

## 实现

### 1. SQL AST
JS实现对SQL的语法分析

#### (1) 版本迭代

| 版本 | 描述 | 说明 | 项目文件 |
| ------ | ------ | ------ | ------ |
| V3.0 | V2版本主要负责搭建基本的分析架构，分析过程还不完善，因此V3版本主要是重构分析过程 | 1.边分析边生成 2.完善分析架构 3.自定义语法规则 4.更多元素的加入 | src/sql/v3.0 |
| V2.0 | V1.0 的完全重构版本 | 1.部分理论基础 2.应用状态机模型 3.分析架构的搭建 | src/sql/v2.0 |
| V1.0 | 面对一个未知技术领域，如何入手，从何入手 | 1.From Scratch版本 2.分析架构差 3.条件判断过多 4.分析过程不合理 | src/sql/v1.0 |

#### (2) 开始使用
- ```index.html```文件用于Web版体验
- 自定义使用需要引入```SQLCompiler.js```文件

#### (3) 项目架构
主要分为 ```Scanner```，```Translator```，```Builder```，```Controller```，```Tester```这几个主要模块。

#### (4) 分析模型
输入一串文法，根据配置的语法规则，提取对应的产生式，构成树结构的模型，用于每一个token的分析。

**假设** : 输入为```cbab```的文法，分析其语法的正确性 ？
**定义** : 产生式为```S -> ABC``` ，其中 ```A -> Da``` ，```A -> c``` ，```B -> b``` ，```C -> ab``` ，```D -> f```
**过程** : ```S -> ABC = Dabab = fabab | S -> ABC = cbab```
**结论** : 由于满足```S -> ABC = cbab```，所以输入串的语法正确

**假设** : 输入为 ```select * from db```的文法，分析其语法的正确性 ？
**定义** : 产生式为 ```Statement -> SelectStatement```，其中 ```SelectStatement -> select ColumnList from TableList```，```ColumnList -> *```，```TableList -> Identifier```
**过程** : ```Statement -> SelectStatement = select ColumnList from TableList = select * from Identifier```， 由于```Token db```类型属于```Identifier```，所以输入串的语法正确

## 参考
[详见资料学习参考](./extra/docs/reference.md)
