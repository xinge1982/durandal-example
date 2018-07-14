/// <reference path="../../app/typings/kendo/kendo.all.d.ts" />

class kendoGridLocal<T> {
    constructor() {
    }

    public static pageable(): any {
        return {
            previousNext: true,
            messages: { display: "总计 {2} 条数据" }
        };
    }

    public static messages(): any {
        return {
            commands: {
                cancel: "取消编辑",
                canceledit: "取消",
                create: "添加",
                destroy: "删除",
                edit: "编辑",
                save: "保存",
                update: "保存",
                excel: "导出Excel"
            }
        };
    }

    public static columnMenu(): any {
        return {
            messages: {
                sortAscending: "升序",
                sortDescending: "降序",
                filter: "过滤",
                columns: "列"
            }
        };
    }

    public static filterable(): any {
        return {
            messages: {
                info: "条件:", // sets the text on top of the Filter menu
                filter: "过滤", // sets the text for the "Filter" button
                clear: "清除", // sets the text for the "Clear" button

                // when filtering boolean numbers
                isTrue: "存在", // sets the text for "isTrue" radio button
                isFalse: "不存在", // sets the text for "isFalse" radio button

                //changes the text of the "And" and "Or" of the Filter menu
                and: "并且",
                or: "或者"
            },
            operators: {
                //filter menu for "string" type columns
                string: {
                    eq: "等于",
                    neq: "不等于",
                    startswith: "起始",
                    contains: "包含",
                    endswith: "结尾"
                },
                //filter menu for "number" type columns
                number: {
                    eq: "等于",
                    neq: "不等于",
                    gte: "大于等于",
                    gt: "大于",
                    lte: "小于等于",
                    lt: "小于"
                },
                //filter menu for "date" type columns
                date: {
                    eq: "等于",
                    neq: "不等于",
                    gte: "晚于(包含)",
                    gt: "晚于",
                    lte: "早于(包含)",
                    lt: "早于"
                },
                //filter menu for foreign key values
                enums: {
                    eq: "等于",
                    neq: "不等于"
                }
            }
        };
    }
}

export = kendoGridLocal;