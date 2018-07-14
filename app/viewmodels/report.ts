/// <reference path="../typings/kendo/kendo.all.d.ts" />
import router = require("plugins/router");
import kendoGridLocal = require('../common/kendoGridLocal');

class report {

    grid: kendo.ui.Grid;
    selectedLog = ko.observable<any>();
    allLogs = ko.observableArray<any>();
    filteredAndSortedLogs: KnockoutComputed<Array<any>>;
    filterLevel = ko.observable("All");
    searchText = ko.observable("");
    searchNameText = ko.observable("");
    searchTextThrottled: KnockoutObservable<string>;
    searchName = ko.observable("");
    searchTypeName = ko.observable("");
    searchRoadId = ko.observable("");
    closed = ko.observable<boolean>(false);
    firstLoadMap = ko.observable<boolean>(true);
    selectedLocation = ko.observable<string>("intersection");
    selectedOption = ko.observable("current");
    selectedDataOption = ko.observable("flow");
    selectedDate = ko.observable<any>();
    selectedHour = ko.observable<any>();
    selectedDirection = ko.observable("All");

    regions = ko.observableArray<any>();

    searchStartDate: kendo.ui.DatePicker;
    searchEndDate: kendo.ui.DatePicker;

    constructor() {
        this.filteredAndSortedLogs = ko.computed<any>(() => {
            var logs = this.allLogs();
            var search = this.searchNameText();
            var type = this.searchTypeName();
            var id = this.searchRoadId();

            var filterlevel = this.filterLevel();

            var filted = logs.filter((e) => {
                var matchSearch =
                    (!search || !e.Name || e.Name.indexOf(search) >= 0) &&
                    (!type || !e.Source || e.Source.indexOf(type) >= 0) &&
                    (!id || !e.NameRoadId || e.NameRoadId == id);

                var matchFilter = true;
                var matchFilter = !filterlevel ||
                    filterlevel === "All" ||
                    (filterlevel === "标记路段" && !!e.NeedLines && e.NeedLines == true);

                return matchFilter && matchSearch;
            });

            return { total: filted.length, data: filted };
        });

        this.selectedLog({ IntersectionId: '1' });
    }

    attached(view, parent) {
        console.log('Lifecycle : attached : report');
    }

    detached(view) {
        console.log('Lifecycle : detached : report');
    }

    compositionComplete(view) {
        // 获取查询条件 雾区
        this.getFogCondition();
        this.initDatePicker();
        // 获取表格数据
        this.getNetworkData(999);
    }

    getSmpFormatDateByLong(l) {
        var date = new Date(l);
        return moment(date).format("YYYY-MM-DD HH:mm:ss");
    }

    refreshData() {
        var self = this;
        $.ajax({
            url: 'http://192.168.0.48:8080/LightServer/TestQuery?tunnelid=1001&startTime=1501464020201&endtTime=1531113007972',
            dataType: 'json',
            success: function (jsonObj) {
                if (!jsonObj) {
                    return;
                }

                self.refreshChart(jsonObj);
                self.refreshGrid(jsonObj);
            }
        });
    }

    refreshGrid(result: any) {
        var grid = $("#dataGrid").kendoGrid(
            {
                dataSource: {
                    pageSize: 10,
                    schema: {
                        data: "data",
                        total: "total",
                        model: {
                            id: "Id",
                            fields: {
                                Id: { editable: false, nullable: false },
                                UpdateTime: { type: 'datetime' }
                            }
                        },
                        parse: function (response) {
                            var results = response.data;
                            results.forEach(r => {
                                r._UpdateTime = moment(r.UpdateTime).toDate();
                            });
                            return response;
                        },
                    },
                    data: result
                },
                excel: {
                    allPages: true
                },
                pageable: true,
                height: 550,
                resizable: true,
                selectable: true,
                sortable: true,
                columns: [
                    { field: "TunnelId", title: "TunnelId", width: "140px" },
                    { field: "DeviceId", title: "DeviceId", width: "100px" },
                    { field: "TunnelEM", title: "总耗电量", width: "100px" },
                    { field: "_UpdateTime", title: "时间", width: "140px", format: '{0:yyyy-MM-dd HH:mm:ss}' },
                ],
                editable: false
            }).data("kendoGrid");

        this.grid = grid;
    }

    exportGrid() {
        var grid = $("#dataGrid").data("kendoGrid");
        grid.saveAsExcel();
    }

    refreshChart(result: any) {
        if (!result.data)
            return;

        var datas = result.data
            .sort((a, b) => {
                return a.UpdateTime - b.UpdateTime;
            })
            .map(ele => {
                return {
                    x: ele.UpdateTime,
                    y: ele.SkValue,
                }
            });

        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        })

        $('#scatterContainer').highcharts({
            chart: {
                type: 'line',
                zoomType: 'xy'
            },
            title: {
                text: '不良出行环境分布图'
            },
            xAxis: {
                type: 'datetime',
                title: {
                    text: '时间'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true,
                minTickInterval: 1
            },
            yAxis: {
                title: {
                    text: '能见度值(M)'
                }
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 100,
                y: 70,
                floating: true,
                backgroundColor: (Highcharts["theme"] && Highcharts["theme"].legendBackgroundColor) || '#FFFFFF',
                borderWidth: 1
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} 月, {point.y} M'
                    }
                }
            },
            series: [{
                name: '能见度',
                color: 'rgba(119, 152, 191, .5)',
                data: datas
            }]
        });
    }

    initDatePicker() {
        var self = this;
        var startdate = new Date();
        startdate.setHours(0, 0, 0, 0);
        var start = $("#start-time").kendoDatePicker({
            start: "month",
            depth: "day",
            format: "yyyy-MM-dd",
            culture: "zh-CN",
            value: moment(startdate.getTime()).subtract("d", 1).startOf('day').toDate(),
            change: function () {
                var startDate = start.value(),
                    endDate = end.value();

                if (startDate) {
                    startDate = new Date(startDate.getTime());
                    startDate.setDate(startDate.getDate());
                    end.min(startDate);
                } else if (endDate) {
                    start.max(new Date(endDate.getTime()));
                } else {
                    endDate = new Date();
                    start.max(endDate);
                    end.min(endDate);
                }

                self.getNetworkData(999);
            }
        }).data("kendoDatePicker");

        this.searchStartDate = start;

        var enddate = new Date();
        enddate.setHours(23, 59, 59, 999);
        var end = $("#end-time").kendoDatePicker({
            start: "month",
            depth: "day",
            format: "yyyy-MM-dd",
            culture: "zh-CN",
            value: moment(enddate.getTime()).toDate(),
            change: function () {
                var endDate = end.value(),
                    startDate = start.value();

                if (endDate) {
                    endDate = new Date(endDate.getTime());
                    endDate.setDate(endDate.getDate());
                    start.max(endDate);
                } else if (startDate) {
                    end.min(new Date(startDate.getTime()));
                } else {
                    endDate = new Date();
                    start.max(endDate);
                    end.min(endDate);
                }

                self.getNetworkData(999);
            }
        }).data("kendoDatePicker");

        this.searchEndDate = end;
        start.max(end.value());
        end.min(start.value());
    }

    /**
     * 设置日期 各个选项
     * type 1-今天 2-1个月  3-3个月  4-1年
     */
    switchChoice(type, obj) {
        $(".datebox button").removeClass("btn-primary").addClass("btn-default");
        $(obj).addClass("btn-primary");
        var now = this.getNowFormatDate("");
        this.searchEndDate.value(moment().toDate());

        if (1 == type || "1" == type) {
            this.searchStartDate.value(moment().startOf('day').toDate());
        }
        if (2 == type || "2" == type) {
            this.searchStartDate.value(moment().subtract(1, 'months').startOf('day').toDate());
        }
        if (3 == type || "3" == type) {
            this.searchStartDate.value(moment().subtract(3, 'months').startOf('day').toDate());
        }
        if (4 == type || "4" == type) {
            this.searchStartDate.value(moment().subtract(1, 'years').startOf('day').toDate());
        }
        // 触发查询
        this.getNetworkData(999);
    }

    /**
     * 获取当前时间
     */
    getNowFormatDate(format) {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month: any = date.getMonth() + 1;
        var strDate: any = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }

        var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes();
        // + seperator2 + date.getSeconds();
        if ("yyyy-MM-dd" == format) {
            currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;
        }
        if ("HH:mm" == format) {
            currentdate = date.getHours() + seperator2 + date.getMinutes();
        }
        return currentdate;
    }

    /**
     * 取日期：前天-2、昨天-1、今天0、明天1、后天2 
     */
    getDateStr(AddDayCount) {
        var dd = new Date();
        dd.setDate(dd.getDate() + AddDayCount);//获取AddDayCount天后的日期 
        var y = dd.getFullYear();
        var m: any = dd.getMonth() + 1;//获取当前月份的日期 

        if ((m + "").length == 1) {
            m = "0" + m;
        }
        var d: any = dd.getDate();
        if ((d + "").length == 1) {
            d = "0" + d;
        }
        return y + "-" + m + "-" + d;
    }

    /**
     * 样式切换
     */
    switchSty(obj, box) {
        $("." + box + " button").removeClass("btn-primary").addClass("btn-default");
        $(obj).addClass("btn-primary");
        this.getNetworkData(99999);
    }

    /**
     * 跳转图表页面
     */
    locaLink() {
        if (!!this.selectedLog().Name &&
            !!this.selectedLog().Id) {
            // router.navigate(this.appUrls.analysisReportDetail() + "?NameRegionId=" + this.selectedLog().Id +
            //     "&NameRegionName=" + this.selectedLog().Name, false);
        }
    }

    /**
     * // 获取查询条件 雾区
     */
    getFogCondition() {
        var self = this;
        // $.ajax({
        //     url: appUrl.forRemoteQuery(null) + '/webapi/nameregion',
        //     dataType: 'json',
        //     success: function (jsonObj) {
        //         if (null == jsonObj || null == jsonObj.data || 0 >= jsonObj.data.length) {
        //             return;
        //         }
        //         jsonObj.data.forEach(r => {
        //             r.dir = r.Name;
        //             r.className = "btn btn-default add-tooltip";
        //         });
        //         jsonObj.data.splice(0, 0, { Name: "全部", dir: "", className: "btn btn-primary", Id: null });
        //         self.regions(jsonObj.data);
        //     }
        // });
    }

    /**
    * 获取列表数据
    */
    getNetworkData(size) {
        var self = this;
        // var url = appUrl.forRemoteQuery(null) + "/webapi/analysis/report";
        // 时间条件
        var start = $("#start-time").val();
        var end = $("#end-time").val();
        var suffix = "";
        if ("" != start && null != start && "" != end && null != end) {
            var longStart = new Date(start).getTime();
            var longEnd = new Date(end).getTime();
            suffix = '?query={"start":' + longStart + ',"end":' + longEnd + '}';
        }
        if ("" != start && null != start && ("" == end || null == end)) {
            var longStart = new Date(start).getTime();
            suffix = '?query={"start":' + longStart + '}';
        }
        if (("" == start || null == start) && "" != end && null != end) {
            var longEnd = new Date(end).getTime();
            suffix = '?query={"end":' + longEnd + '}';
        }
        // 列表过滤 雾区名称
        var namex = $("#namebox .btn-primary").attr("dir");
        var name = $("#namebox .btn-primary").text();
        var idx = $("#namebox .btn-primary").attr("Id");
        self.selectedLog({ Name: name, Id: idx });

        // $.ajax({
        //     url: appUrl.forRemoteQuery(null) + url + suffix,
        //     dataType: 'json',
        //     success: function (jsonObj) {
        //         if (null == jsonObj || null == jsonObj.data || 0 >= jsonObj.data.length) {
        //             return;
        //         }
        //         var ax = [];
        //         $.each(jsonObj.data, function (i, item) {
        //             var xname = item.Name;

        //             if ("" == namex || 0 <= xname.indexOf(namex)) {
        //                 ax.push({
        //                     CmsCost: item.CmsCost,
        //                     MeanSpeed: item.MeanSpeed,
        //                     AutoLightCost: item.AutoLightCost,
        //                     Cts: item.Cts,
        //                     Time: self.getSmpFormatDateByLong(item.Time),
        //                     Flow: item.Flow,
        //                     VisAvg: item.VisAvg,
        //                     VisMin: item.VisMin,
        //                     Name: item.Name,
        //                     VisAlarmDuration: item.VisAlarmDuration,
        //                     Type: item.Type,
        //                     UpdateTime: item.UpdateTime,
        //                     VisMax: item.VisMax,
        //                     NameRegionId: item.NameRegionId,
        //                     Id: item.Id,
        //                     AllCost: item.AllCost,
        //                     VisAlarmTimes: item.VisAlarmTimes
        //                 });
        //             }
        //         })
        //         self.createGrid(ax);
        //         // $("#namebox").append(hstr);
        //     }
        // });
    }

    /**
     * 创建表格
     */
    createGrid(datax) {
        var self = this;
        var grid = $("#kendoGrid").kendoGrid(
            {
                dataSource: {
                    pageSize: 10,
                    // data: createRandomData(50)
                    schema: {
                        data: "data",
                        total: "total",
                        model: {
                            id: "Id",
                            fields: {
                                Id: { editable: false, nullable: false },
                                NameRegionId: {},
                                Time: { type: 'datetime' }
                            }
                        },
                        parse: function (response) {
                            var results = response.data;
                            results.forEach(r => {
                                $.processLogDateTimeSingle(r, false);
                            });
                            return response;
                        },
                    },
                    data: { data: datax, total: datax.length }
                },
                pageable: true,
                height: 550,
                resizable: true,
                selectable: true,
                columns: [
                    {
                        command: [{
                            name: "详情", click: function (e) {
                                var tr = $(e.target).closest("tr"); //get the row for deletion
                                var data = $("#kendoGrid").data("kendoGrid").dataItem(tr); //get the row data so it can be referred later
                                // html 传值编码
                                // alert(encodeURIComponent(data.NameRegionId));
                                // alert(data.Name);
                                // alert(data.NameRegionId);
                                // if (!!data) {
                                //     router.navigate(self.appUrls.analysisReportDetail() + "?NameRegionId=" + data["NameRegionId"] +
                                //         "&NameRegionName=" + data["Name"], false);
                                // }
                                e.preventDefault();
                            }
                        }], title: "操作", width: "110px"
                    },
                    { field: "Name", title: "雾区名称", width: "140px" },
                    { field: "AllCost", title: "总耗电量", width: "100px" },
                    { field: "CmsCost", title: "CMS耗电量", width: "100px" },
                    { field: "AutoLightCost", title: "主动发光标志耗电量", width: "140px" },
                    { field: "VisMin", title: "最小能见度", width: "100px" },
                    { field: "VisMax", title: "最大能见度", width: "100px" },
                    { field: "VisAvg", title: "平均能见度", width: "100px" },
                    { field: "VisAlarmDuration", title: "持续时间", width: "100px" },
                    { field: "VisAlarmTimes", title: "能见度报警次数", width: "140px" },
                    { field: "MeanSpeed", title: "中值平均速度", width: "100px" },
                    { field: "Flow", title: "区段总流量", width: "100px" },
                    { field: "Time", title: "时间", width: "140px", format: '{0:yyyy-MM-dd HH:mm:ss}' },
                ],
                editable: false
            }).data("kendoGrid");

        // 颜色变换
        this.transformColor();
    }

    /**
     * 颜色变换
     */
    transformColor() {
        // var map = new Map();
        // map.put(1, "blueColor");
        // map.put(2, "orangeColor");
        // map.put(3, "greenColor");
        // map.put(4, "redColor");
        // var i = 1;
        // $("#kendoGrid").find("tr").each(function () {
        //     if (i > 4) {
        //         i = 1;
        //     }
        //     $(this).addClass(map.get(i));
        //     i++;
        // });
    }
}

export = report;