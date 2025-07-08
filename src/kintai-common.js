
var APPINFO = {
	'タイムカード' : {
		APPID : 26,
		VIEWID : {
		},
		APITOKEN : ''
	},
	'スタッフ管理' : {
		APPID : 25,
		VIEWID : {
		},
		APITOKEN : ''
	},
	'拠点マスタ' : {
		APPID : 24,
		VIEWID : {
		},
		APITOKEN : ''
	},
	'作業日報' : {
		APPID : 22,
		VIEWID : {
		},
		APITOKEN : ''
	},
	'作業日報_アルバイト' : {
		APPID : 27,
		VIEWID : {
		},
		APITOKEN : ''
	},
	'出勤種別' : {
		APPID : 23,
		VIEWID : {
		},
		APITOKEN : ''
	},
}

var ORGINFO = {
	'管理者' : {
		CODE : '管理'
	},
	'事務員' : {
		CODE : '事務'
	},
	'その他従業員' : {
		CODE : 'その他従業員'
	}
}


//* Moment初期設定 *//
//ローカライズ
moment.locale('ja');
//Moment曜日短縮設定
moment.updateLocale("ja", {
	weekdays: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
	weekdaysShort: ["日", "月", "火", "水", "木", "金", "土"],
});



var JsSdkInstance = function() {

	this.kintoneAuth        = '';
	this.kintoneConnection  = '';
	this.kintoneRecord      = '';
	this.kintoneApp         = '';

	this.authInfo = {
		type    : '',
		username: '',
		password: '',
		apiToken: '',
		cert    : '',
		filePath: ''
	}

	this.createAuth = function() {

		this.kintoneAuth = new kintoneJSSDK.Auth();

		if(this.authInfo.type == 'password') {
			this.kintoneAuth.setPasswordAuth({
				username: this.authInfo.username,
				password: this.authInfo.password
			});
		} else if(this.authInfo.type == 'apitoken') {
			this.kintoneAuth.setApiToken({
				apiToken: this.authInfo.apiToken
			});
		} else if(this.authInfo.type == 'basic') {
			this.kintoneAuth.setBasicAuth({
				username: this.authInfo.username,
				password: this.authInfo.password
			});
		} else if(this.authInfo.type == 'clientcert') {
			this.kintoneAuth.setClientCert({
				cert: this.cert,
				password: this.authInfo.password
			});
		} else if(this.authInfo.type == 'clientCertByPath') {
			this.kintoneAuth.setClientCertByPath({
				filePath: this.authInfo.filePath,
				password: this.authInfo.password
			});
		}
	}

	this.createConnection = function() {
		if(this.kintoneAuth) {
			this.kintoneConnection = new kintoneJSSDK.Connection({auth: this.kintoneAuth});
		} else {
			this.kintoneConnection = new kintoneJSSDK.Connection();
		}
	}

	this.createRecord = function() {
		if(this.kintoneConnection) {
			this.kintoneRecord = new kintoneJSSDK.Record({connection: this.kintoneConnection});
		} else {
			this.kintoneRecord = new kintoneJSSDK.Record();
		}
	}

	this.createApp = function() {
		if(this.kintoneConnection) {
			this.kintoneApp = new kintoneJSSDK.App({connection: this.kintoneConnection});
		} else {
			this.kintoneApp = new kintoneJSSDK.App();
		}
	}

	this.setup = function(params) {
		this.authInfo.type     = params.authType || '';
		this.authInfo.username = params.username || '';
		this.authInfo.password = params.password || '';
		this.authInfo.apiToken = params.apiToken || '';
		this.authInfo.cert     = params.cert     || '';
		this.authInfo.filePath = params.filePath || '';

		if(this.authInfo.type) {
			this.createAuth();
			this.createConnection();
		}
		this.createRecord();
		this.createApp();
	}
}

/**
 *
 * APIによるレコード取得共通処理
 *
 * @param {Object} params
 * @return {Object}
 */
function getRecords(params) {
	var app = params.app || kintone.app.getId();
	var query = params.query;
	var apiToken = params.apiToken || '';

	var requestBody = {};

	requestBody.type = 'GET';
	requestBody.url = kintone.api.url('/k/v1/records', true) + '?app=' + app + '&query=' + encodeURI(query);
	requestBody.async = false;

	requestBody.headers = {};
	requestBody.headers['X-Requested-With'] = 'XMLHttpRequest';
	if(apiToken) requestBody.headers['X-Cybozu-API-Token'] = apiToken;

	var result = jQuery.ajax(requestBody);
	if (result.status == 200) {
		return result.responseJSON.records;
	}
	else {
		console.error(result.responseJSON);
		throw Error('レコード取得時のエラー');
	}
}


function getAllRecords(_params) {
	var params = _params       || {};
	var app    = params.app    || kintone.app.getId();
	var fields = params.fields || [];
	var query  = params.query  || '';

	var jsSdkInstance = new JsSdkInstance();
	jsSdkInstance.setup(params);

	var rcOption = {
		app   : app,
		fields: fields,
		query : query
	};
	return jsSdkInstance.kintoneRecord.getAllRecordsByCursor(rcOption);
}

function postAllRecords(_params) {
	return new kintone.Promise(function (resolve, reject) {
		var params  = _params || {};
		var app     = params.app || kintone.app.getId();
		var records = params.records || [];

		if(!records.length) {
			resolve();
			return;
		}

		var jsSdkInstance = new JsSdkInstance();
		jsSdkInstance.setup(params);

		var rcOption = {
			app   : app,
			records: records
		};
		jsSdkInstance.kintoneRecord.addAllRecords(rcOption).then(function(resp) {
			resolve(resp);
		}).catch(function (err) {
			reject(err);
		});
	});
}

function putAllRecords(_params) {
	return new kintone.Promise(function (resolve, reject) {
		var params  = _params || {};
		var app     = params.app || kintone.app.getId();
		var records = params.records || [];

		if(!records.length) {
			resolve();
			return;
		}

		var jsSdkInstance = new JsSdkInstance();
		jsSdkInstance.setup(params);

		var rcOption = {
			app   : app,
			records: records
		};
		jsSdkInstance.kintoneRecord.updateAllRecords(rcOption).then(function(resp) {
			resolve(resp);
		}).catch(function (err) {
			reject(err)
		});
	});
}



function getOrg(_params) {
	return new kintone.Promise(function (resolve, reject) {
		var params = _params || {};
		var ids    = params.ids || [];
		var codes  = params.codes || [];

		var opt = {
			ids : ids,
			codes : codes
		}
		kintone.api(kintone.api.url('/v1/organizations'), 'GET', opt, function(resp) {
			resolve(resp);
		}, function(err) {
			reject(err);
		});
	});
}

function getOrgUser(_params) {
	return new kintone.Promise(function (resolve, reject) {
		var params = _params || {};
		var code   = params.code || '';

		var opt = {
			code : code
		}
		kintone.api(kintone.api.url('/v1/organization/users'), 'GET', opt, function(resp) {
			resolve(resp);
		}, function(err) {
			reject(err);
		});
	});
}

function checkUserInOrg(_params) {
	return new kintone.Promise(function (resolve, reject) {
		var params   = _params || {};
		var orgcode  = params.orgcode || [];
		var usercode = params.usercode || '';

		if(!orgcode.length) {
			reject('組織コードが指定されていません。');
			return false;
		}

		var promiseArray = [];
		for(var i = 0; i < orgcode.length; i++) {
			var orgParams = {
				code : orgcode[i]
			}
			promiseArray.push( getOrgUser(orgParams) );
		}

		kintone.Promise.all(promiseArray).then(function (results) {
			var resultObj = {
				check : false,
				checkArray : []
			};
			for(var i = 0; i < results.length; i++) {
				var users = results[i].userTitles;
				var bool = users.some(function(elm) { return elm.user.code == usercode });
				resultObj.check = resultObj.check || bool;
				resultObj.checkArray.push(bool);
			}
			resolve(resultObj);
		});
	});
}

/**
 *指定フィールドの連結値をキーとしたHashを生成する
 *
 * @param {array, array} list(レコード配列), keyFieldsAry([フィールドコード1, フィールドコード2, …])
 * @returns {object} {key1: [record, …], key2: [record, …]}
 */
function createHashObj(list, keyFieldsAry) {
	var obj = {};
	for (var i = 0; i < list.length; i++) {
		var record = list[i];
		var key = (function () {
			var _key = ''
			for (var j = 0; j < keyFieldsAry.length; j++) {
				_key += record[keyFieldsAry[j]].value;
			}
			return _key;
		})();
		if (obj.hasOwnProperty(key)) {
			obj[key].push(record);
		} else {
			obj[key] = [record];
		}
	}
	return obj;
}


/**
 * スピナーを動作させる関数
 *
 * @param {}
 * @return {}
 */
function showSpinner() {
	// 要素作成等初期化処理
	if (jQuery('.kintone-spinner').length == 0) {
		// スピナー設置用要素と背景要素の作成
		var spin_div = jQuery('<div id ="kintone-spin" class="kintone-spinner"></div>');
		var spin_bg_div = jQuery('<div id ="kintone-spin-bg" class="kintone-spinner"></div>');

		// スピナー用要素をbodyにappend
		jQuery(document.body).append(spin_div, spin_bg_div);

		// スピナー動作に伴うスタイル設定
		jQuery(spin_div).css({
			'position': 'fixed',
			'top': '50%',
			'left': '50%',
			'z-index': '510',
			'background-color': '#fff',
			'padding': '26px',
			'-moz-border-radius': '4px',
			'-webkit-border-radius': '4px',
			'border-radius': '4px'
		});
		jQuery(spin_bg_div).css({
			'position': 'absolute',
			'top': '0px',
			'left': '0px',
			'z-index': '500',
			'width': '100%',
			'height': '500%',
			'background-color': '#000',
			'opacity': '0.5',
			'filter': 'alpha(opacity=50)',
			'-ms-filter': "alpha(opacity=50)"
		});

		// スピナーに対するオプション設定
		var opts = {
			'color': '#000'
		};

		// スピナーを作動
		new Spinner(opts).spin(document.getElementById('kintone-spin'));
	}

	// スピナー始動（表示）
	jQuery('.kintone-spinner').show();
}


/**
 * スピナーを停止させる関数
 *
 * @param {}
 * @return {}
 */
function hideSpinner() {
	// スピナー停止（非表示）
	jQuery('.kintone-spinner').hide();
}


/**
 *要素にカレンダー機能を設定する
 *
 * @param {object} elm
 */
function setDatePicker(elm) {
	elm.datepicker({
		dateFormat: 'yy-mm-dd',
		closeText: "閉じる",
		prevText: "&#x3C;前",
		nextText: "次&#x3E;",
		currentText: "今日",
		monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		monthNamesShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		dayNames: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
		dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
		dayNamesMin: ["日", "月", "火", "水", "木", "金", "土"],
		weekHeader: "週",
		isRTL: false,
		showMonthAfterYear: true,
		yearSuffix: "年",
		firstDay: 1, // 週の初めは月曜
		showButtonPanel: true, // "今日"ボタン, "閉じる"ボタンを表示する
		beforeShow: function (input, inst) {
			var calendar = inst.dpDiv;
			setTimeout(function () {
				calendar.position({
					my: 'left top',
					at: 'left bottom',
					of: input
				});
				jQuery('.ui-datepicker').css('z-index', 99999999999999); //最前面表示
			}, 1);
		}
	});
}


/**
 * エラー処理
 *
 * @param {object} error
 */
function errorOut(error) {
	hideSpinner();
	console.error(error);
	alert('処理中にエラーが発生しました。もう一度実行してください。\n※何度も発生する場合は管理者へ問い合わせてください。');
	return false;
}

var KintoneDefaultControlClass = function() {
	var cond;
	var setParam = function(_param) {
		var param = _param || {};
		cond = param.hasOwnProperty('cond') ? param.cond : true;
	}

	this.index = {};
	this.index.edit = {};
	this.index.delete = {};

	this.index.edit.show = function(param) {
		setParam(param);
		if(cond) {
			jQuery('.recordlist-edit-gaia').show();
		}
	}
	this.index.edit.hide = function(param) {
		setParam(param);
		if(cond) {
			jQuery('.recordlist-edit-gaia').hide();
		}
	}
	this.index.delete.show = function(param) {
		setParam(param);
		if(cond) {
			jQuery('.recordlist-remove-gaia').show();
		}
	}
	this.index.delete.hide = function(param) {
		setParam(param);
		if(cond) {
			jQuery('.recordlist-remove-gaia').hide();
		}
	}
}
var kintoneDefaultControl = new KintoneDefaultControlClass();

/**
 * BulkRequest用body作成メソッド
 * @param  {String} API API名(POST,PUT,DELETE)
 * @param  {Number} app 対象アプリID
 * @param  {Object} body RESTAPIのBODY
 * @param  {Object,Array} requests bulkRequestBODY(空のオブジェクト、配列でも可)
 */
 function createBulkRequestBody(API, app, body, requests) {
	//obj,配列どちらにも対応する
	var bodyArray = [];
	bodyArray = bodyArray.concat(body);

	//100件以上の配列
	var body100EachArray = [];
	for (var i = 0; i < Math.ceil(bodyArray.length / 100); i++) {
		var j = i * 100;
		body100EachArray.push(bodyArray.slice(j, j + 100));
	}

	var requestBody = [];
	for (var i in body100EachArray) {
		switch (API) {
			case 'POST':
			case 'PUT':
				requestBody.push({
					'method': API,
					'api': '/k/v1/records.json',
					'payload': {
						'app': app,
						'records': body100EachArray[i]
					}
				});
				break;
			case 'DELETE':
				var ids = [], revisions = [];
				for (var j in body100EachArray[i]) {
					if (body100EachArray[i][j].hasOwnProperty('id')) ids.push(body100EachArray[i][j].id);
					if (body100EachArray[i][j].hasOwnProperty('revision')) revisions.push(body100EachArray[i][j].revision);
				}
				requestBody.push({
					'method': API,
					'api': '/k/v1/records.json',
					'payload': {
						'app': app,
						'ids': ids,
						'revisions': revisions,
					}
				});
				break;
		}
	}
	Array.prototype.push.apply(requests, requestBody);
}

/**
 * REST API (bulkRequest)
 * @param  {Object} requests bulkRequestBODY
 * @return {Promise} kintone.Promise 正常時にresolve,異常時にreject
 */
function bulkRequest(requests) {
	return new kintone.Promise(function (resolve, reject) {
		if (!requests.length) {
			resolve();
			return false;
		}
		if (20 < requests.length) {
			console.error(new Error('bulkRequestsは20件までです。'));
			reject(new Error('bulkRequestsは20件までです。'));
			return false;
		}
		var body = { 'requests': requests };
		kintone.api(kintone.api.url('/k/v1/bulkRequest', true), 'POST', body, function (r) {
			console.log(r);
			resolve(r);
		}, function (e) {
			console.error(e);
			reject(new Error('一括更新における異常'));
		});
	});
}

/**
 *モバイル版かPC版かのチェック
 *
 * @param {*} eventType イベントタイプ
 * @returns boolean
 * 	true mobile
 * 	false PC
 */
function mobileCheck(eventType) {
	return eventType.indexOf('mobile') === -1 ? false :true;
}

//位置情報対応端末チェック
function checkGeolocation() {
	if(!navigator.geolocation) alert( "あなたの端末では、現在位置を取得できません。" );
	return navigator.geolocation;
}

//位置情報取得
function getGeolocation() {
	return new kintone.Promise(function (resolve, reject) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var data = position.coords ;
			resolve(data);
		}, function(e) {
			var errorMessage = {
				0: "原因不明のエラーが発生しました。",
				1: "位置情報の取得が許可されていません。\niPhoneの場合：設定⇒プライバシー⇒位置情報サービス⇒Chrome⇒このAppの使用中のみ許可",
				2: "電波状況などで位置情報が取得できませんでした。",
				3: "位置情報の取得に時間がかかり過ぎてタイムアウトしました。",
			} ;
			alert(errorMessage[e.code]);
			reject(e);
		}, {'enableHighAccuracy' : true});
	});
}

function distanceLatLng(lat1, lng1, lat2, lng2) {
	lat1 *= Math.PI / 180;
	lng1 *= Math.PI / 180;
	lat2 *= Math.PI / 180;
	lng2 *= Math.PI / 180;
	return 6371 * Math.acos(Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1) + Math.sin(lat1) * Math.sin(lat2));
}

function checkKyoyoDistance(KyoyoDistance, latlng) {
	var distance = distanceLatLng(latlng.lat1 , latlng.lng1, latlng.lat2, latlng.lng2);
	if(KyoyoDistance < distance) {
		return 'NG';
	} else {
		return 'OK';
	}
}

//START 2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）
function getWorkTimeMaster() {

	// 時間区分マスタ
	return {
			'一般社員': [
					//{'st': '05:00', 'ed': '08:00', 'type': 'early'},    // 1 早出
					{'st': '08:00', 'ed': '10:00', 'type': 'normal'},   // 2 午前勤務1
					{'st': '10:00', 'ed': '10:15', 'type': 'rest'},     // 3 午前休憩
					{'st': '10:15', 'ed': '12:00', 'type': 'normal'},   // 4 午前勤務2
					{'st': '12:00', 'ed': '13:00', 'type': 'rest'},     // 5 昼休憩
					{'st': '13:00', 'ed': '15:00', 'type': 'normal'},   // 6 午後勤務1
					{'st': '15:00', 'ed': '15:15', 'type': 'rest'},     // 7 午後休憩
					{'st': '15:15', 'ed': '17:30', 'type': 'normal'},   // 8 午前勤務2
					{'st': '17:30', 'ed': '22:00', 'type': 'over'},     // 9 残業
					{'st': '22:00', 'ed': '23:59', 'type': 'late'},     // 10 深夜勤務
					{'st': '00:00', 'ed': '05:00', 'type': 'late'},     // 11 深夜勤務
			],
			'事務員': [
					//{'st': '05:00', 'ed': '08:30', 'type': 'early'},    // 1 早出
					{'st': '08:30', 'ed': '10:00', 'type': 'normal'},   // 2 午前勤務1
					{'st': '10:00', 'ed': '10:15', 'type': 'rest'},     // 3 午前休憩
					{'st': '10:15', 'ed': '12:00', 'type': 'normal'},   // 4 午前勤務2
					{'st': '12:00', 'ed': '13:00', 'type': 'rest'},     // 5 昼休憩
					{'st': '13:00', 'ed': '15:00', 'type': 'normal'},   // 6 午後勤務1
					{'st': '15:00', 'ed': '15:15', 'type': 'rest'},     // 7 午後休憩
					{'st': '15:15', 'ed': '17:30', 'type': 'normal'},   // 8 午前勤務2
					{'st': '17:30', 'ed': '22:00', 'type': 'over'},     // 9 残業
					{'st': '22:00', 'ed': '23:59', 'type': 'late'},     // 10 深夜勤務
					{'st': '00:00', 'ed': '05:00', 'type': 'late'},     // 11 深夜勤務
			],
			'事務員・週初日': [
					//{'st': '05:00', 'ed': '08:00', 'type': 'early'},    // 1 早出
					{'st': '08:00', 'ed': '10:00', 'type': 'normal'},   // 2 午前勤務1
					{'st': '10:00', 'ed': '10:15', 'type': 'rest'},     // 3 午前休憩
					{'st': '10:15', 'ed': '12:00', 'type': 'normal'},   // 4 午前勤務2
					{'st': '12:00', 'ed': '13:00', 'type': 'rest'},     // 5 昼休憩
					{'st': '13:00', 'ed': '15:00', 'type': 'normal'},   // 6 午後勤務1
					{'st': '15:00', 'ed': '15:15', 'type': 'rest'},     // 7 午後休憩
					{'st': '15:15', 'ed': '17:00', 'type': 'normal'},   // 8 午前勤務2
					{'st': '17:00', 'ed': '22:00', 'type': 'over'},     // 9 残業
					{'st': '22:00', 'ed': '23:59', 'type': 'late'},     // 10 深夜勤務
					{'st': '00:00', 'ed': '05:00', 'type': 'late'},     // 11 深夜勤務
			]
	};
}

function getTable(org_type, work_type) {
	var $_master = getWorkTimeMaster();
	if (org_type == '一般社員') {
			return $_master['一般社員'];
	} else {
			if (work_type == '週初日') {
					return $_master['事務員・週初日'];
			}

			return $_master['事務員'];
	}
}

function calcWorkTime(date, org_type, work_type, start, end) {
	// 出勤時年月日
	var $_st_dt = moment(date).format('YYYY-MM-DD');
	// 退勤時年月日
	var $_end_dt = ((end >= '00:00' && end <= '05:00') ? moment($_st_dt).add(1, 'd').format('YYYY-MM-DD') : $_st_dt);

	// 時間区分マスタ
	var $_master_table = getTable(org_type, work_type);
	var $_table = getTable(org_type, work_type);

	// 結果
	var $_work = {
			'normal': 0,
			'early': 0,
			'over': 0,
			'late': 0,
			'rest': 0,
			'late_start': 0,
			'early_end': 0,
			'total': 0,
			'all_total': 0,
	};

	// 出勤時間
	var $_work_st = moment($_st_dt + ' ' + start).format('YYYY-MM-DD HH:mm');
	// 退勤時間
	var $_work_ed = moment($_end_dt + ' ' + end).format('YYYY-MM-DD HH:mm');
	// 退勤 - 出勤
	$_work['all_total'] = moment($_work_ed).diff(moment($_work_st), 'minute')

	var $_st_index = -1;
	var $_ed_index = -1;

	// 出勤基準時間
	var $_bs_st_time = '08:00';
	// 退勤基準時間
	var $_bs_ed_time = '17:00';

	if (org_type == '事務員' && work_type != '週初日') {
			$_bs_st_time = '08:30';
			$_bs_ed_time = '17:30';
	}
	if (org_type == '一般社員') {
		$_bs_st_time = '08:00';
		$_bs_ed_time = '17:30';
	}

	// 勤怠時間テーブル上の開始・終了インデックスを確定させる.
	for (var i = 0; i < $_table.length; i++) {
		var $_row = $_table[i];
		var $_block_st = moment($_st_dt + ' ' + $_row['st']).format('YYYY-MM-DD HH:mm');
		var $_block_ed = moment($_st_dt + ' ' + $_row['ed']).format('YYYY-MM-DD HH:mm');

		if (i == 9) {
			$_block_ed = moment($_st_dt + ' ' + $_row['ed']).add(1, 'days').format('YYYY-MM-DD HH:mm')
		} else if (i >= 10) {
			$_block_st = moment($_st_dt + ' ' + $_row['st']).add(1, 'days').format('YYYY-MM-DD HH:mm')
			$_block_ed = moment($_st_dt + ' ' + $_row['ed']).add(1, 'days').format('YYYY-MM-DD HH:mm')
		}

		if ($_st_index == -1) {
			if ($_work_st < $_block_st) {
				$_st_index = (i - 1);
			}

			if ($_ed_index == -1 && $_st_index != -1) {
				if ($_work_ed <= $_block_ed) {
					$_ed_index = i - 1;
				}
			}
		}

		if ($_ed_index == -1 && $_st_index != -1) {
			if ($_work_ed <= $_block_ed) {
				$_ed_index = i;
			}
		}
	}

	// 確定した勤怠時間テーブル単位で実績を集計
	for (var i = $_st_index; i <= $_ed_index; i++) {
		var $_row = $_table[i];

		if (i == $_st_index) {
			if ($_row['type'] == 'rest') {
				i++;
				$_st_index++;
				$_row = $_table[i];
			}
		}
		if (i == $_ed_index) {
			if ($_row['type'] == 'rest') {
				$_ed_index--;
				break
			}
		}

		var $_block_st = moment($_st_dt + ' ' + $_row['st']).format('YYYY-MM-DD HH:mm');
		var $_block_ed = moment($_st_dt + ' ' + $_row['ed']).format('YYYY-MM-DD HH:mm');

		if (i == 9) {
			$_block_ed = moment($_st_dt + ' ' + $_row['ed']).add(1, 'days').format('YYYY-MM-DD HH:mm');
		} else if (i >= 10) {
			$_block_st = moment($_st_dt + ' ' + $_row['st']).add(1, 'days').format('YYYY-MM-DD HH:mm');
			$_block_ed = moment($_st_dt + ' ' + $_row['ed']).add(1, 'days').format('YYYY-MM-DD HH:mm');
		}

		if ($_work_st >= $_block_st && $_work_st <= $_block_ed) {
			// 実開始時間を設定
			$_row['st'] = moment($_work_st).format('HH:mm');
		}

		if ($_work_ed >= $_block_st && $_work_ed <= $_block_ed) {
			// 実終了時間を設定
			$_row['ed'] = moment($_work_ed).format('HH:mm');
		}

		$_block_st = moment(moment($_block_st).format('YYYY-MM-DD') + ' ' + $_row['st']);
		$_block_ed = moment(moment($_block_ed).format('YYYY-MM-DD') + ' ' + $_row['ed']);

		// 時間算出
		$_row['min'] = $_block_ed.diff($_block_st, 'minute');

		// 時間タイプ別に実績時間設定
		$_work[$_row['type']] = (($_row['type'] in $_work) ? $_work[$_row['type']] + $_row['min'] : $_row['min']);

		if ($_row['type'] !== 'rest') {
			// 休憩以外は総稼働時間に加算
			$_work['total'] = (('total' in $_work) ? $_work['total'] + $_row['min'] : $_row['min']);
		}

		// 遅刻時間の算出
		if (i == $_st_index) {
			// 出勤基準時間との時間差
			$_work['late_start'] = moment($_st_dt + ' ' + $_row['st']).diff(moment($_st_dt + ' ' + $_bs_st_time), 'minute');

			// 出勤時間より前方の休憩時間を集計
			// 例) 11:00出勤の場合 10:00〜10:14までの休憩は遅刻時間から除外
			var $_rest = 0;

			for (var n = 0; n < $_st_index; n++) {
				if ($_table[n]['type'] == 'rest') {
					$_rest += moment($_st_dt + ' ' + $_table[n]['ed']).diff(moment($_st_dt + ' ' + $_table[n]['st']), 'minute');
				}
			}

			if ($_row['type'] == 'rest') {
				$_rest += moment($_st_dt + ' ' + $_master_table[$_st_index]['ed']).diff(moment($_st_dt + ' ' + $_master_table[$_st_index]['st']), 'minute');
			}

			if ($_work['late_start'] < 0) {
				$_work['late_start'] = 0;
			} else {
				$_work['late_start'] = $_work['late_start'] - $_rest;
			}
		}

		// 早退時間の算出
		//2024.02.28 午前休憩・午後休憩中の退勤時に早退時間がカウントされない（ゼロになる）ため、条件をコメントアウト　担当：武川（REP）
//		if (i == $_ed_index && $_row['type'] == 'normal') {
			// 退勤基準時間との時間差
			$_work['early_end'] = moment($_st_dt + ' ' + $_bs_ed_time).diff(moment($_st_dt + ' ' + $_row['ed']), 'minute');

			// 退勤時間より後方の休憩時間を集計
			// 例) 14:00退勤の場合 15:00〜15:14までの休憩は早退時間から除外
			var $_rest = 0;
			for (var n = $_ed_index; n < $_table.length; n++) {
				if ($_table[n]['type'] == 'rest') {
					$_rest += moment($_st_dt + ' ' + $_table[n]['ed']).diff(moment($_st_dt + ' ' + $_table[n]['st']), 'minute');
				}
			}

			if ($_row['type'] == 'rest') {
				$_rest += moment($_st_dt + ' ' + $_master_table[$_ed_index]['ed']).diff(moment($_st_dt + ' ' + $_master_table[$_ed_index]['st']), 'minute');
			}

			if ($_work['early_end'] < 0) {
				$_work['early_end'] = 0;
			} else {
				$_work['early_end'] = $_work['early_end'] - $_rest;
			}
//		}
	}

	// 算定結果の丸め
	// 早出時間
	//START  2021.04.14 【一時対応】早出処理停止（手動で計算）　担当：武川（REP）
	//if ($_work['early'] > 0) {
	//	if ($_work['early'] <= 60) {
	//		// 60以内 > 0分
	//		$_work['early'] = 0;
	//	} else if ($_work['early'] > 60 && $_work['early'] <= 90) {
	//		// 60〜90 > 60分単位
	//		$_work['early'] = Math.floor($_work['early'] / 60) * 60;
	//	} else {
	//		// 90〜 > 30分単位
	//		$_work['early'] = Math.floor($_work['early'] / 30) * 30;
	//	}
	//}
	//END  2021.04.14 【一時対応】早出処理停止（手動で計算）　担当：武川（REP）

	// 残業時間
	if ($_work['over'] > 0) {
		// 10分単位で切り下げた時間
		$_work['over'] = Math.floor($_work['over'] / 10) * 10;
	}

	// 深夜勤務時間
	if ($_work['late'] > 0) {
		// 10分単位で切り下げた時間
		$_work['late'] = Math.floor($_work['late'] / 10) * 10;
	}

	$_work['all_total'] = $_work['all_total'] - $_work['rest'];

	return $_work;
}
//END  2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）