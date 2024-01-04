//test vpn ; test again ; test more again
//test 2015-07-17 00:28
var FlowAction = {
    Send: 1,
    Back: 2,
    Skip: 3,
    Cancel: 4,
    AddSign: 5,
    TakeBack: 6
};

var Class = {
    create: function () {
        return function () {
            this.initialize.apply(this, arguments);
        }
    }
};

String.prototype.toArray = function () {
    return this.split('');
};

//返回一个数组
var $A = Array.from = function (iterable) {
    if (!iterable)
        return [];

    if (iterable.toArray) {
        return iterable.toArray();
    }
    else {
        var results = [];
        for (var i = 0; i < iterable.length; i++)
            results.push(iterable[i]);
        return results;
    }
}

/*
Array.shift: 删除数组中第一个元素，并返回该元素
Array.concat:将参数中指定的元素与数组中的元素连接，并新建新的数组。如果 value 参数指定的是数组，则连接该数组的元素而不是该数组本身。
*/
Function.prototype.bind = function () {
    var __method = this,
        args = $A(arguments),
        object = args.shift();

    return function () {
        return __method.apply(object, args.concat($A(arguments)));
    }
}

Function.prototype.bindAsEventListener = function (object) {
    var __method = this;
    return function (event) {
        return __method.call(object, event || window.event);
    }
}

var FlowApprove = Class.create();

FlowApprove.prototype = {
    /****************************************************
    类构造器
    参数:para ，格式为：
    {   dataId:       整型－业务数据Id,
        bizCode:        字符型－业务代码,
        wndId:          字符型－当前审批控件所在的表单Id， 必须指定，以方便回调
        verifyFn:       Function类型－页面校验方法
        saveFn:         Function类型－页面保存方法
        afterSendFn:    Function类型－送出后调用的方法
    }
    *****************************************************/
    initialize: function (para, isDialog) {
        this.isDialog = isDialog;
        this.autoSend = para.autoSend;
        this.dataId = para.dataId;
        this.bizCode = para.bizCode;
        this.isView = para.isView;   //是否只读
        this.wndId = para.wndId;
        this.dialogContentWnd = para.dialogContentWnd;
        this.approveBtnId = "byDlg_" + this.wndId + "_btnApprove";  //审批按钮
        this.traceBtnId = "byDlg_" + this.wndId + "_btnTrace";      //流程跟踪按钮
        this.menuId = "byDlg_" + this.wndId + "_mm";
        this.sendBtnId = "byDlg_" + this.wndId + "_send";
        this.backBtnId = "byDlg_" + this.wndId + "_back";
        this.addBtnId = "byDlg_" + this.wndId + "_add";
        this.skipBtnId = "byDlg_" + this.wndId + "_skip";
        this.stopBtnId = "byDlg_" + this.wndId + "_stop";
        this.takeBackBtnId = "byDlg_" + this.wndId + "_takeback";
        this.recordBtnId = "byDlg_" + this.wndId + "_records";

        if (para.saveBtnId)
            this.saveBtnId = para.saveBtnId;
        else
            this.saveBtnId = "byDlg_" + this.wndId + "_btnOK";

        this.verifyFn = para.verifyFn;
        this.saveFn = para.saveFn;
        this.passFn = para.passFn;
        this.backFn = para.backFn;
        this.stopFn = para.stopFn;
        this.restartAble = para.restartAble;
    },

    load: function () {
        $.ajax({
            url: byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=approvestateinfo&bizCode=" + this.bizCode + "&dataId=" + this.dataId,
            dataType: "json",
            type: "post",
            timeout: 5000,
            success: this.setStateInfo.bind(this),
            error: function (e) {
                alert("流程信息加载失败。");
            }
        })
    },

    setStateInfo: function (json) {
        this.stateInfo = json;
        this.tkId = this.stateInfo.tkId;
        this.bizId = this.stateInfo.bizId;
        this.flowId = this.stateInfo.flowId;
        this.nodeId = this.stateInfo.nodeId;

        //isView属性
        this.stateInfo.sendAble = (this.stateInfo.sendAble && (!this.isView));
        this.stateInfo.backAble = (this.stateInfo.backAble && (!this.isView));
        this.stateInfo.addSignAble = (this.stateInfo.addSignAble && (!this.isView));
        this.stateInfo.cancelAble = (this.stateInfo.cancelAble && (!this.isView));
        this.stateInfo.skipAble = (this.stateInfo.skipAble && (!this.isView));
        this.stateInfo.takeBackAble = (this.stateInfo.takeBackAble && (!this.isView));
        this.stateInfo.restartAble = (this.stateInfo.restartAble && (!this.isView));

        this.restartAble = (this.stateInfo.restartAble || this.restartAble);
        this.stateInfo.restartAble = this.restartAble;

        var btnSave = this.jqueryObject(this.saveBtnId);     
        var msend = this.jqueryObject(this.sendBtnId);
        var mback = this.jqueryObject(this.backBtnId);
        var mtakeback = this.jqueryObject(this.takeBackBtnId);
        var mstop = this.jqueryObject(this.stopBtnId);
        var madd = this.jqueryObject(this.addBtnId);
        var mskip = this.jqueryObject(this.skipBtnId);
        var btn = this.jqueryObject(this.approveBtnId);
        var traceBtn = this.jqueryObject(this.traceBtnId);
        var mrecords = this.jqueryObject(this.recordBtnId);
        var menuId = this.menuId;
        var mm = this.jqueryObject(menuId);

        if (this.stateInfo.saveAble) {
            if (btnSave.css("display") != "none") {
                btnSave.show();
            }
        }
        else {
            btnSave.hide();
        }

        if (this.isDialog) {
            btnSave.hide();
        }

        //设置流程里面的按钮分别是否显示
        if (document.all)           //ie浏览器
        {
            msend.attr("disabled", !this.stateInfo.sendAble);
            mback.attr("disabled", !this.stateInfo.backAble);
            madd.attr("disabled", !this.stateInfo.addSignAble);
            mstop.attr("disabled", !this.stateInfo.cancelAble);
            mskip.attr("disabled", !this.stateInfo.skipAble);
            mtakeback.attr("disabled", !this.stateInfo.takeBackAble);
        }
        else {
            if (this.stateInfo.sendAble)
                mm.menu('enableItem', '#' + this.sendBtnId);
            else
                mm.menu('disableItem', '#' + this.sendBtnId);

            if (this.stateInfo.backAble)
                mm.menu('enableItem', '#' + this.backBtnId);
            else
                mm.menu('disableItem', '#' + this.backBtnId);

            if (this.stateInfo.takeBackAble)
                mm.menu('enableItem', '#' + this.takeBackBtnId);
            else
                mm.menu('disableItem', '#' + this.takeBackBtnId);

            if (this.stateInfo.cancelAble)
                mm.menu('enableItem', '#' + this.stopBtnId);
            else
                mm.menu('disableItem', '#' + this.stopBtnId);

            if (this.stateInfo.skipAble)
                mm.menu('enableItem', '#' + this.skipBtnId);
            else
                mm.menu('disableItem', '#' + this.skipBtnId);

            if (this.stateInfo.addSignAble)
                mm.menu('enableItem', '#' + this.addBtnId);
            else
                mm.menu('disableItem', '#' + this.addBtnId);
        }

        //客户端前置脚本
        var fnPreTrans;
        this.clientScriptPre = this.stateInfo.clientScriptPre;
        if (this.clientScriptPre.length > 0) {
            this.validateFn = new Function('cw', 'dataId', this.clientScriptPre);
            fnPreTrans = this.validateFn;
        }

        //客户端后置脚本
        this.clientScriptAfter = this.stateInfo.clientScriptAfter;
        if (this.clientScriptAfter.length > 0) {
            this.afterSendFn = new Function('cw', 'dataId', this.clientScriptAfter);
        }

        //bind，以便能够在click事件中调用
        var fnValid = this.verifyFn.bind(this);
        var fnSave = this.saveFn.bind(this);
        var pWndId = this.wndId;
        var dialogCW = this.dialogContentWnd;

        btn.die("click");
        traceBtn.die("click");
        msend.die("click");
        mback.die("click");
        mstop.die("click");
        mskip.die("click");
        madd.die("click");
        mtakeback.die("click");
        mrecords.die("click");

        //如果可重新发起，则将同意按钮，修改为“重新发起”
        if (this.restartAble) {
            mm.menu('setText', { target: msend, text: '重新发起' });

            if (document.all) {
                msend.attr("disabled", false);
            }
            else {
                mm.menu('enableItem', msend);  //msend
            }
        }

        var pkid = this.dataId;

        if (this.stateInfo.tkId == 0) {  //|| this.stateInfo.nodeId == 1) {
            if (this.isView) {
                btn.hide();
            }
            var fnBeforeSend = this.beforeSend.bind(this);
            var activateSend = this.activeSendBtn.bind(this);

            //按钮直接响应事件
            btn.attr("value", "送 批");
            btn.live('click', function () {
                if (fnValid) {
                    var valid = fnValid(dialogCW);
                    var PreCondition = function () {
                        try {
                            return dialogCW.PreCondition();
                        }
                        catch (e) {
                            return true;
                        }
                    }
                    if (valid) {
                        if (PreCondition()) {
                            //送批的前置客户端脚本处理，有则需判断，无则直接处理
                            if (fnPreTrans) {
                                if (fnPreTrans(dialogCW, pkid)) {
                                    btn.attr("disabled", "disabled");
                                    setTimeout(function () { activateSend(); }, 4000);

                                    //校验成功，保存数据，如果保存成功，则在保存方法中执行流程处理
                                    fnSave({ doflow: fnBeforeSend, dialogContentWnd: dialogCW });
                                }
                            } else {
                                btn.attr("disabled", "disabled");
                                setTimeout(function () { activateSend(); }, 4000);

                                //校验成功，保存数据，如果保存成功，则在保存方法中执行流程处理
                                fnSave({ doflow: fnBeforeSend, dialogContentWnd: dialogCW });
                            }
                        }

                    }
                }
                //fnSave();
            });
        } else {
            var fnBeforeSend = this.beforeSend.bind(this);
            var fnBeforeSecondSend = this.beforeSecondSend.bind(this)

            //为各菜单绑定事件
            if (this.stateInfo.sendAble || this.restartAble) {
                if (this.stateInfo.nodeId == 1) {
                    mm.menu('setText', { target: msend, text: '送批' });
                }
                else {
                    if (this.restartAble) {
                        mm.menu('setText', { target: msend, text: '重新发起' });
                    } else {
                        mm.menu('setText', { target: msend, text: '同意' });
                    }
                }

                //二次送批，选人时点取消，表单修改内容会保存bug处理
                var tmp_param = this.restartAble ? { skipSave: true, doflow: fnBeforeSecondSend, dialogContentWnd: dialogCW } : { doflow: fnBeforeSend, dialogContentWnd: dialogCW }

                msend.live('click', function () {
                    mm.hide();
                    if (fnValid) {
                        var valid = fnValid(dialogCW);
                        var PreCondition = function () {
                            try {
                                return dialogCW.PreCondition();
                            }
                            catch (e) {
                                return true;
                            }
                        }
                        if (PreCondition()) {
                            if (valid) {
                                if (fnPreTrans) {
                                    if (fnPreTrans(dialogCW, pkid)) {
                                        fnSave(tmp_param)
                                    }
                                } else {
                                    fnSave(tmp_param)
                                }
                            }
                        }
                    }
                });
            }

            //退回(不同意)
            if (this.stateInfo.backAble) {
                var fnBeforeBack = this.beforeBack.bind(this);
                this.backToNodes = this.stateInfo.backToNodes;   //要退回的节点

                //如果是pdf归档的流程退回时需保存
                var canSave = (this.bizCode == "BASEMAP_ARCHIVE") || this.stateInfo.isUntreadSave;

                mback.live('click', function () {
                    mm.menu('hide');
                    fnSave({ doflow: fnBeforeBack, dialogContentWnd: dialogCW, skipSave: (!canSave) });
                });
            }

            //加签
            if (this.stateInfo.addSignAble) {
                var fnBeforeAdd = this.beforeAdd.bind(this);
                madd.live('click', function () {
                    mm.hide();
                    if (fnValid) {
                        if (fnValid(dialogCW)) {
                            fnSave({ doflow: fnBeforeAdd, dialogContentWnd: dialogCW });
                        }
                    }
                });
            }

            //跳转
            if (this.stateInfo.skipAble) {
                var fnBeforeSkip = this.beforeSkip.bind(this);
                mskip.live('click', function () {
                    mm.hide();
                    fnSave({ doflow: fnBeforeSkip, dialogContentWnd: dialogCW });
                });
            }

            //中止
            if (this.stateInfo.cancelAble) {
                var fnBeforeStop = this.beforeStop.bind(this);
                mstop.live('click', function () {
                    mm.hide();
                    fnSave({ doflow: fnBeforeStop, dialogContentWnd: dialogCW, skipSave: true });
                });
            }

            //收回
            if (this.stateInfo.takeBackAble) {
                //var fnTakeBack = this.takeBack.bind(this);
                var fnBeforeTakeBack = this.beforeTakeBack.bind(this);
                mtakeback.live('click', function () {
                    mm.hide();
                    fnSave({ doflow: fnBeforeTakeBack, dialogContentWnd: dialogCW, skipSave: true });
                });
            }

            var url = byshow.cookie.getCookie("VirtualPath") + '/biz/workflow/approve-records.aspx?tkId=' + this.tkId;

            //审批记录
            mrecords.live('click', function () {
                mm.hide();
                byshow.dialog.open({
                    id: "approverecordwnd",
                    title: "审批记录",
                    DialogUrl: url,
                    width: 600,
                    height: 400,
                    isView: true,
                    sendObj: {},
                    onClickbtnOK: function (e) {
                    }
                });
            });

            btn.attr("value", "审 批");

            //点击按钮弹出菜单
            btn.live('click', function (e) {
                var ctrl = btn.get(0);
                var x = byshow.DomHelper.GetPositionX(ctrl);
                var y = byshow.DomHelper.GetPositionY(ctrl) - 167;
                if (mm.length > 0) {
                    mm.menu('show', {
                        left: x,  // e.clientX
                        top: y  //e.clientY 
                    });
                }
            });
        }

        //this.setPermit();
        var traceUrl = byshow.cookie.getCookie("VirtualPath") + '/biz/workflow/flowchart_view.aspx?tk_id=' + this.tkId + "&flow_id=" + this.flowId + "&data_id=" + this.dataId + "&biz_base_id=" + this.bizId;
        //流程跟踪
        traceBtn.live('click', function () {
            byshow.dialog.open({
                id: "flowtracewnd",
                title: "流程跟踪",
                DialogUrl: traceUrl,
                width: 750,
                height: 600,
                isView: true,
                sendObj: {},
                onClickbtnOK: function (e) {
                }
            });
        });

        var fn = this.send.bind(this);
        //如果需自动处理、且当前用户具有发送权限，且未送出过，则执行自动处理
        if (!this.sended && this.autoSend && this.stateInfo.sendAble) {
            this.sended = true;
            setTimeout(fn, 500);
        }
    },

    activeSendBtn: function () {
        try {
            this.jqueryObject(this.approveBtnId).removeAttr("disabled");
        } catch (e) {; }
    },

    activeSendOK: function () {
        try {
            top.$('#byDlg_beforesendwnd_btnOK').removeAttr("disabled"); //.show();
        } catch (e) {; }
    },
    //保存成功后，弹出对话框确认下一步，确认后页面将调用this.send(obj)方法
    //dataId:为数据id，当用户保存成功后返回该数据
    beforeSend: function (dataId) {
        if (dataId > 0) {
            this.dataId = dataId;
        }
        var fn = this.send.bind(this);
        var beforeSendWndId = "beforesendwnd";
        var activateOK = this.activeSendOK.bind(this);

        //针对子项审批重新发起的特殊处理，因初始流程和重新发起流程不是一个
        var url = byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/send.aspx?tkid=" + this.tkId + "&flowid=" + this.flowId + "&nodeid=" + this.nodeId + "&dataid=" + dataId + "&isrestart=" + this.restartAble;

        if (this.stateInfo.restartAble && this.bizCode == "PROJECT_LX_SUB_SF") {
            url = byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/send.aspx?tkid=0&flowid=32&nodeid=" + this.nodeId + "&dataid=" + dataId + "&isrestart=" + this.restartAble;
        }

        byshow.dialog.open({
            id: beforeSendWndId,
            title: "流程处理",
            DialogUrl: url,
            width: 600,
            height: 460,
            sendObj: {},
            onClickbtnOK: function (e) {
                top.$('#byDlg_' + beforeSendWndId + "_btnOK").attr("disabled", "disabled");
                
                setTimeout(function () { activateOK(); }, 4000);
                var settings = e.getSettings();
                if (settings) {
                    fn(settings, beforeSendWndId);
                }
            },
            onLoad: function (cw, dialogWndId, obj) {
                //cw.initPage(obj)
            }
        });
    },

    beforeSecondSend: function (dataId) {
        if (dataId > 0) {
            this.dataId = dataId;
        }
        var fnSend = this.send.bind(this);
        var beforeSendWndId = "beforesendwnd";
        var activateOK = this.activeSendOK.bind(this);
        var dialogContentWnd = this.dialogContentWnd

        //针对子项审批重新发起的特殊处理，因初始流程和重新发起流程不是一个
        var url = byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/send.aspx?tkid=" + this.tkId + "&flowid=" + this.flowId + "&nodeid=" + this.nodeId + "&dataid=" + dataId + "&isrestart=" + this.restartAble;

        if (this.stateInfo.restartAble && this.bizCode == "PROJECT_LX_SUB_SF") {
            url = byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/send.aspx?tkid=0&flowid=32&nodeid=" + this.nodeId + "&dataid=" + dataId + "&isrestart=" + this.restartAble;
        }

        byshow.dialog.open({
            id: beforeSendWndId,
            title: "流程处理",
            DialogUrl: url,
            width: 600,
            height: 460,
            sendObj: {},
            onClickbtnOK: function (e) {
                top.$('#byDlg_' + beforeSendWndId + "_btnOK").attr("disabled", "disabled");

                setTimeout(function () { activateOK(); }, 4000)

                //重新送批，保存操作放在送批后
                dialogContentWnd.doEvent("onSave", function () {
                    var settings = e.getSettings();
                    if (settings) {
                        fnSend(settings, beforeSendWndId);
                    }
                })
            },
            onLoad: function (cw, dialogWndId, obj) {
                //cw.initPage(obj)
            }
        });
    },

    //在送批确认中调用此方法
    send: function (obj, beforeSendWndId) {
        var flowParameter = {
            tkId: this.tkId,
            bizId: this.bizId,
            flowId: this.flowId,
            dataId: this.dataId,
            isReApply: this.stateInfo.restartAble,
            action: FlowAction.Send,
            approveTBDItems: (this.autoSend ? null : obj.approveUsers),
            noticeTBDItems: (this.autoSend ? null : obj.noticeUsers),
            bizCode: this.bizCode,
            comment: (this.autoSend ? '同意（自动处理）' : obj.comment)
        };

        //对重新发起的特殊处理，立项审批子流程当作项目审批流程发起
        if (this.stateInfo.restartAble) {
            if (this.bizCode == "PROJECT_LX_SUB_SF") {
                flowParameter.bizCode = "PROJECT_LX_SUB";
                flowParameter.bizId = 43;
            }
        }

        var str = $.toJSON(flowParameter);
        var fn = this.setStateInfo.bind(this);
        var fnSetForm = this.setPermit.bind(this);

        var wndId = this.wndId;

        var passFn;
        if (this.passFn) {
            passFn = this.passFn.bind(this);
        }

        var bizWnd = this.dialogContentWnd;
        var afterSendFn = this.afterSendFn;

        $.post(
            byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=doflow",
            { data: str },
            function (result) {
                if (result.succ) {
                    top.$.messager.alert("成功", result.message, 'info');

                    if (beforeSendWndId) {
                        byshow.dialog.close(beforeSendWndId);
                    }

                    if (byshow.cookie.getCookie("DialogClose") == "true") {
                        if (passFn) {
                            passFn(result.data, { flowWnd: bizWnd, refreshAble: result.data.sendAble });
                        }

                        byshow.dialog.close(wndId);       //关闭业务页面
                    } else {
                        //重新设置业务页面
                        fn(result.data);
                        fnSetForm();

                        if (passFn) {
                            passFn(result.data, { flowWnd: bizWnd, refreshAble: result.data.sendAble });

                            if (result.data.sendAble) {
                                try { bizWnd.doEvent("refreshForm", result.data.dataId); } catch (e) {; }
                            }
                        }
                    }
                    //后置脚本处理
                    if (afterSendFn) {
                        if (!afterSendFn(bizWnd, result.data.dataId)) {
                            return false;
                        }
                    }
                    //可能要执行业务页面传入的处理事件
                }
                else {
                    top.$.messager.alert("失败", result.message, 'warning');
                }
            },
            "json"
        );
    },

    //快速送批，此方法用在业务页面中“同意”控件之事件绑定
    quickSend: function (skipDialog, comment) {
        var fnValid = this.verifyFn.bind(this);     //业务页面之校验
        var fnSave = this.saveFn.bind(this);        //          保存
        var pWndId = this.wndId;
        var dialogCW = this.dialogContentWnd;
        //var fnBeforeSend = this.beforeSend.bind(this);

        //客户端前置脚本
        var fnPreTrans;
        if (this.clientScriptPre.length > 0) {
            this.validateFn = new Function('cw', 'dataId', this.clientScriptPre);
            fnPreTrans = this.validateFn;
        }

        if (fnValid) {
            var valid = fnValid(dialogCW);

            if (valid) {
                var fn = (skipDialog ? this.beforeQuickSend.bind(this) : this.beforeSend.bind(this));

                if (fnPreTrans) {
                    if (fnPreTrans(dialogCW, pkid)) {
                        fnSave({ doflow: fn, dialogContentWnd: dialogCW });
                    }
                } else {
                    fnSave({ doflow: fn, dialogContentWnd: dialogCW });
                }
            }
        }
    },

    beforeQuickSend: function (dataId, comment) {
        if (dataId > 0) {
            this.dataId = dataId;
        }

        var settings = {
            approveUsers: [],
            noticeUsers: [],
            comment: comment
        };

        var fn = this.send.bind(this);
        var beforeSendWndId = "beforesendwnd";
        fn(settings, beforeSendWndId);
    },

    //退回前调用的页面
    beforeBack: function () {
        var fn = this.back.bind(this);
        var flowWndId = "beforebackwnd";

        byshow.dialog.open({
            id: flowWndId,
            title: "流程处理（退回）",
            DialogUrl: byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/back.aspx?tkid=" + this.tkId + "&flowid=" + this.flowId + "&dataid=" + this.dataId,
            width: 600,
            height: 460,

            sendObj: {},

            onClickbtnOK: function (e) {
                var settings = e.getSettings();

                if (settings.tonodes == "") {
                    top.$.messager.alert("提示信息", "无可退回节点，不能退回。", 'info');
                } else {
                    fn(settings, flowWndId);
                }
            },

            onLoad: function (cw, dialogWndId, obj) {
                //cw.initPage(obj)
            }
        });
    },

    //退回
    back: function (obj, beforeBackWndId) {
        var flowParameter = {
            action: FlowAction.Back,
            tkId: this.tkId,
            flowId: this.flowId,
            dataId: this.dataId,
            bizCode: this.bizCode,
            toNodes: obj.tonodes, //this.backToNodes,  2014-9-2修改，将退回上一环节改为选择要退回的节点
            comment: obj.comment,
            flowRoute: obj.flowRoute  //0-流程顺序执行，1-原路返回，系统默认为0
        };

        var str = $.toJSON(flowParameter);
        var fn = this.setStateInfo.bind(this);
        var fnSetForm = this.setPermit.bind(this);

        var backFn;

        if (this.backFn) {
            backFn = this.backFn.bind(this);
        }

        $.post(
            byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=doflow",
            { data: str },
            function (result) {
                if (result.succ) {
                    top.$.messager.alert("成功", result.message, 'info');

                    byshow.dialog.close(beforeBackWndId);

                    //重新设置业务页面
                    fn(result.data);
                    fnSetForm();

                    if (backFn) {
                        backFn(result.data);
                    }

                    //可能要执行业务页面传入的处理事件
                } else {
                    top.$.messager.alert("失败", result.message, 'warning');
                }
            }, "json");

    },

    //加签前调用的页面
    beforeAdd: function () {
        var fn = this.add.bind(this);
        var flowWndId = "beforeaddwnd";

        byshow.dialog.open({
            id: flowWndId,
            title: "流程处理（加签）",
            DialogUrl: byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/add.aspx",
            width: 600,
            height: 460,

            sendObj: {},

            onClickbtnOK: function (e) {
                var settings = e.getSettings();

                if (settings) {
                    fn(settings, flowWndId);
                }
            },

            onLoad: function (cw, dialogWndId, obj) {
                //cw.initPage(obj)
            }
        });
    },

    add: function (obj, beforeAddWndId) {
        var flowParameter = {
            action: FlowAction.AddSign,
            tkId: this.tkId,
            flowId: this.flowId,
            dataId: this.dataId,
            bizCode: this.bizCode,
            comment: obj.comment,
            addSignItems: obj.addSignItems
        };

        var str = $.toJSON(flowParameter);
        var fn = this.setStateInfo.bind(this);
        var fnSetForm = this.setPermit.bind(this);

        var passFn;

        if (this.passFn) {
            passFn = this.passFn.bind(this);
        }

        $.post(
            byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=doflow",
            { data: str },
            function (result) {
                if (result.succ) {
                    top.$.messager.alert("成功", result.message, 'info');

                    byshow.dialog.close(beforeAddWndId);

                    //重新设置业务页面
                    fn(result.data);
                    fnSetForm();

                    if (passFn) {
                        //passFn(result.data);
                        //passFn(result.data, { flowWnd: bizWnd });
                        passFn(result.data, { flowWnd: bizWnd, refreshAble: result.data.sendAble });

                        if (result.data.sendAble) {
                            try { bizWnd.doEvent("refreshForm", result.data.dataId); } catch (e) {; }
                        }

                    }

                    //可能要执行业务页面传入的处理事件
                } else {
                    top.$.messager.alert("失败", result.message, 'warning');
                }
            }, "json");

    },

    //跳转前的页面
    beforeSkip: function (dataId) {
        if (dataId > 0) {
            this.dataId = dataId;
        }

        var fn = this.skip.bind(this);
        var flowWndId = "beforeskipwnd";

        byshow.dialog.open({
            id: flowWndId,
            title: "流程处理（跳转）",
            DialogUrl: byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/skip.aspx?tkid=" + this.tkId + "&flowid=" + this.flowId + "&nodeid=" + this.nodeId + "&dataid=" + dataId,
            width: 600,
            height: 460,
            sendObj: {},
            onClickbtnOK: function (e) {
                var settings = e.getSettings();

                if (settings) {
                    fn(settings, flowWndId);
                }
            },

            onLoad: function (cw, dialogWndId, obj) {
                //cw.initPage(obj)
            }
        });
    },

    skip: function (obj, beforeSkipWndId) {

        var flowParameter = {
            tkId: this.tkId,
            bizId: this.bizId,
            flowId: this.flowId,
            dataId: this.dataId,
            action: FlowAction.Skip,
            toNodes: obj.toNodes,
            approveTBDItems: obj.approveUsers,
            noticeTBDItems: obj.noticeUsers,
            bizCode: this.bizCode,
            comment: obj.comment
        };

        var str = $.toJSON(flowParameter);
        var fn = this.setStateInfo.bind(this);
        var fnSetForm = this.setPermit.bind(this);

        var passFn;

        if (this.passFn) {
            passFn = this.passFn.bind(this);
        }

        $.post(
        byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=doflow",
        { data: str },
        function (result) {
            if (result.succ) {
                top.$.messager.alert("成功", result.message, 'info');

                byshow.dialog.close(beforeSkipWndId);

                //重新设置业务页面
                fn(result.data);
                fnSetForm();

                if (passFn) {
                    //passFn(result.data);
                    //passFn(result.data, { flowWnd: bizWnd });
                    passFn(result.data, { flowWnd: bizWnd, refreshAble: result.data.sendAble });

                    if (result.data.sendAble) {
                        try { bizWnd.doEvent("refreshForm", result.data.dataId); } catch (e) {; }
                    }

                }

                //可能要执行业务页面传入的处理事件
            } else {
                top.$.messager.alert("失败", result.message, 'warning');
            }
        }, "json");

    },

    beforeStop: function () {
        var fn = this.stop.bind(this);
        var flowWndId = "beforestopwnd";

        byshow.dialog.open({
            id: flowWndId,
            title: "流程处理（中止/撤销）",
            DialogUrl: byshow.cookie.getCookie("VirtualPath") + "/biz/workflow/stop.aspx?tkid=" + this.tkId,
            width: 600,
            height: 460,

            sendObj: {},

            onClickbtnOK: function (e) {
                var settings = e.getSettings();

                if (settings) {
                    fn(settings, flowWndId);
                }
            },

            onLoad: function (cw, dialogWndId, obj) {
                //cw.initPage(obj)
            }
        });

    },

    stop: function (obj, beforeStopWndId) {
        var flowParameter = {
            action: FlowAction.Cancel,
            tkId: this.tkId,
            flowId: this.flowId,
            dataId: this.dataId,
            bizCode: this.bizCode,
            comment: obj.comment
        };

        var str = $.toJSON(flowParameter);
        var fn = this.setStateInfo.bind(this);
        var fnSetForm = this.setPermit.bind(this);

        $.post(
            byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=doflow",
            { data: str },
            function (result) {
                if (result.succ) {
                    top.$.messager.alert("成功", result.message, 'info');

                    byshow.dialog.close(beforeStopWndId);

                    //重新设置业务页面
                    fn(result.data);
                    fnSetForm();

                    //可能要执行业务页面传入的处理事件
                } else {
                    top.$.messager.alert("失败", result.message, 'warning');
                }
            }, "json");

    },

    beforeTakeBack: function () {
        var fn = this.takeBack.bind(this);

        top.$.messager.confirm('收回', '确定收回您所做的操作吗？', function (r) {
            if (r) {
                fn();
            }
        });
    },

    takeBack: function () {
        var flowParameter = {
            action: FlowAction.TakeBack,
            tkId: this.tkId,
            flowId: this.flowId,
            dataId: this.dataId,
            bizCode: this.bizCode
        };

        var str = $.toJSON(flowParameter);
        var fn = this.setStateInfo.bind(this);
        var fnSetForm = this.setPermit.bind(this);
        var afterSendFn = this.afterSendFn;

        $.post(
            byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=doflow",
            { data: str },
            function (result) {
                if (result.succ) {
                    top.$.messager.alert("成功", (result.message ? result.message : "成功撤回!"), 'info');

                    //重新设置业务页面
                    fn(result.data);
                    fnSetForm();

                    //后置脚本处理，第三个参数表示逆操作
                    if (afterSendFn) {
                        if (!afterSendFn(bizWnd, result.data.dataId, true)) {
                            return false;
                        }
                    }

                } else {
                    top.$.messager.alert("失败", result.message, 'warning');
                }
            }, "json");

    },

    setPermit: function () {
        if (!this.stateInfo) return;
        if (!this.stateInfo.permits) return;

        //设置控件的显隐，是否可编辑等属性
        for (var i = 0; i < this.stateInfo.permits.length; i++) {
            var permit = this.stateInfo.permits[i];
            //获取控件
            var ctrl = this.dialogContentWnd.$("#" + permit.ctrlName);
            if (permit.inputMode == 8) {
                if (permit.canRead)
                    ctrl.next(".combo").show();
                else
                    ctrl.next(".combo").hide();

                if (!permit.canWrite)
                    ctrl.combobox("disable");
                else
                    ctrl.combobox("enable");
            }
            else {
                if (permit.canRead)
                    ctrl.show();
                else
                    ctrl.hide();
                ctrl.attr("disabled", !permit.canWrite);
            }
        }

        this.onFlowReady();
    },

    //流程加载完毕时，调用该方法
    onFlowReady: function () {
        if (!this.stateInfo) return;
        var wnd = this.dialogContentWnd;
        if (wnd) {
            try {
                var obj = { };
                wnd.onFlowReady(this.stateInfo, { quickSend: this.quickSend.bind(this) });
            }
            catch (e)
            {

            }
        }
    },

    jqueryObject: function (id) {
        if (!this.isDialog) {
            return top.$("#" + id);
        } else {
            return $("#" + id);
        }
    },

};

//设置控件是否可用
function setDisabled(jqueryObj, val) {
    if (document.all) {
        jqueryObj.attr("disabled", val);
    }
    else
    {
        var ctrl = jqueryObj.get(0);
        switch (ctrl.tagName) {
            case "DIV":
            case "A":
                if (val) {
                    jqueryObj.css("color", "#c9aeaf");
                } else {
                    jqueryObj.css("color", "#000000");
                }
                break;
            default:
                jqueryObj.removeAttr("disabled");
                if (val) {
                    jqueryObj.attr("disabled", val);
                }
                break;
        }
    }
}

/*************************************************************************
弹出带流程审批的内容页面
方法：openFlowDialog(options, callBackFn);
参数：options: {bizCode: string, dataId: int, urlExtend: object}
callBackFn：执行保存或送出成功后的回调函数
说明：bizCode为业务代码，本表为biz_base；dataId：为当前表的主键id, urlExtend为url扩展参数
*************************************************************************/
function openFlowDialog(options, callBackFn) {
    //获取form
    $.ajax({
        url: byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=bizinfo&biz_code=" + options.bizCode,
        dataType: "json",
        type: "post",
        timeout: 5000,
        success: function (result) {
            if (result.succ) {
                var form = result.data.form;

                //dialogUrl
                var dialogUrl = form.url;
                if (options.forceUrl)
                    dialogUrl = options.forceUrl;

                if (dialogUrl.indexOf("?") > -1)
                    dialogUrl += "&id=" + options.dataId;
                else
                    dialogUrl += "?id=" + options.dataId;

                //urlExtend
                if (options.urlExtend) {
                    for (var v in options.urlExtend) {
                        dialogUrl += "&" + v + "=" + options.urlExtend[v];
                    }
                }
                dialogUrl += "&__pass=1";

                var isView = (options.isView ? true : false);
                //var cancelClickBtn = (options.cancelClickBtn ? true : false);
                var disabledFlow = (options.disabledFlow ? true : false);

                //弹出流程审批页面
                byshow.dialog.open({
                    //id: options.bizCode,
                    id: byshow.Ut.NewGuid(),
                    title: (options.title ? options.title : form.form_title),
                    DialogUrl: dialogUrl,
                    width: form.w,
                    height: form.h,
                    isView: isView,
                    disabledFlow: disabledFlow,
                    sendObj: options.sendObj,
                    currBtn: options.currBtn,
                    //cancelClickBtn: cancelClickBtn,
                    isApprove: true,
                    flowOptions: {
                        dataId: options.dataId,                 //主键id
                        bizCode: options.bizCode,               //业务代码
                        verifyFn: (options.verifyFn ? options.verifyFn : function (arg) { return true; }),
                        passFn: (options.passFn ? options.passFn : callBackFn), //callBackFn,
                        backFn: (options.backFn ? options.backFn : callBackFn), //callBackFn,
                        stopFn: (options.stopFn ? options.stopFn : callBackFn), //callBackFn,
                        isView: isView,
                        restartAble: (options.restartAble ? true : false),
                        disabledFlow: disabledFlow,
                        saveFn: function (arg) {
                            // fnSave({ doflow: fnBeforeSend, dialogContentWnd: dialogCW });
                            //执行正常的保存 
                            //如果保存成功，则返回pkid，并且执行arg.doflow(pkid)
                            if (arg) {
                                //如果需要跳出保存，则只做流转
                                if (arg.skipSave) {
                                    arg.doflow(options.dataId);
                                }
                                else {
                                    //保存并流转
                                    arg.dialogContentWnd.doEvent("onSave", function (optData) {
                                        //检查业务页面是否有传入更多参数，有则取页面上传入的意见
                                        var comment = (arguments.length > 1 ? arguments[1] : null);
                                        //保存成功调用
                                        if (options.dataId > 0) {
                                            arg.doflow(options.dataId, comment);
                                        }
                                        else {
                                            arg.doflow(optData, comment);
                                        }
                                        //callBackFn();
                                        //byshow.dialog.close(options.bizCode);
                                    });
                                }
                            }
                        }
                    },
                    //保存
                    onClickbtnOK: function (cw) {
                        var digID = this.id;
                        cw.doEvent("onSave", function (optData) {
                            byshow.dialog.close(digID);
                            callBackFn(optData);
                        });
                    },
                    onClickbtnCancel: options.onClickbtnCancel,
                    onLoad: function (cw, dialogWndId, obj) {
                        if (obj) {
                            if (cw.doEvent) {
                                cw.doEvent('onLoad', obj);
                            }
                        }
                    }
                });
            }
            else {
                top.$.messager.alert("错误", result.message, 'error');
            }
        },
        error: function (e) {
            //alert("获取表单信息失败。"); 
        }
    });
}

/*************************************************************************
弹出普通消息页面
方法：openAlertDialog(alertId);
参数：alertId可为id或者alert对象
*************************************************************************/
function openAlertDialog(alertId) {
    if (typeof alertId == "object") {
        viewAlert(alertId);
    }
    else {
        $.ajax(
        {
            url: byshow.cookie.getCookie("VirtualPath") + "/biz/handler.ashx?command=getalert&alert_id=" + alertId,
            dataType: "json",
            type: "post",
            timeout: 5000,
            success: function (result) {
                if (!result.failure) {
                    viewAlert(result);
                }
            },
            error: function (e) {
                //alert("获取消息失败。"); 
            }
        });
    }
}

//查看消息
function viewAlert(alertInfo) {
    if (alertInfo.alert_type > 0) {
        openFlowDialog({ bizCode: alertInfo.code, dataId: alertInfo.data_id });
    }
    else
    {
        //如果不带url，则直接弹出系统的消息
        if (alertInfo.url.length == 0) {
            var DialogUrl = byshow.cookie.getCookie("VirtualPath") + '/dialog/dig_message.aspx?pkid=' + alertInfo.alert_id;
            byshow.dialog.open({
                id: "MessageShow", title: "系统消息", DialogUrl: DialogUrl, width: 500, height: 350, isView: true,
                onClickbtnOK: function (e) {
                    var digID = this.id;
                    byshow.dialog.close(digID);
                }
            });
        }
        else
        {
            byshow.dialog.open({
                id: 'alert_viewer',
                title: '系统消息',
                DialogUrl: alertInfo.url,
                width: alertInfo.w,
                height: alertInfo.h,
                isView: true
            });
        }
    }
}