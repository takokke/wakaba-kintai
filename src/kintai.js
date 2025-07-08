jQuery.noConflict();
(function ($) {
	'use strict';
	kintone.events.on(['portal.show', 'mobile.portal.show'], function (event) {
 	
		initHtmlTimecard(event);
        return event;
	});

	function initHtmlTimecard(event) {
        // スマホかチェック
		if (mobileCheck(event.type)) {
			createElmTimecard().appendTo(kintone.mobile.portal.getContentSpaceElement());
		} else {
			createElmTimecard().appendTo(kintone.portal.getContentSpaceElement());
		}

		createEventTimecard();


		function createElmTimecard() {
			var $frame = $('<div>', {
				style: 'margin: 10px auto;' +
					'border: 5px double #333333;' +
					'border-radius: 20px;' +
					'background-color: #ffffff;' +
					'width: 90%;'
			});

			var $table = $('<table>', {
				style: 'width: 90%;' +
					'margin: auto;',
				id:'table-syukkinTaikin'
			});

			var $tr1 = $('<tr>', {
					style: 'height: 70px;',
					id: 'tr-syukkinTaikin'
			}).append(
				$('<td>', {
					style: 'text-align: center;'
				}).append(
					$('<button>', {
						class: 'kintoneplugin-button-dialog-ok',
						style: 'font-weight:bold;' +
							'background-color:rgb(43, 242, 17);' +
							'box-shadow: 1px 1px 1px #4169e1;' +
							'min-width: 70%;',
						id: 'button-syukkin',
						text: '出勤'
					})
				)
			).append(
				$('<td>', {
					style: 'text-align: center;'
				}).append(
					$('<button>', {
						class: 'kintoneplugin-button-dialog-ok',
						style: 'font-weight:bold;' +
							'background-color:rgb(221, 80, 143);' +
							'box-shadow: 1px 1px 1px #ff8c00;' +
							'min-width: 70%;',
							id: 'button-taikin',
						text: '退勤'
					})
				)
			)

			var $tr2 = $('<tr>', {
				style: 'height: 50px;',
				id: 'tr-tyokkoTyokki'
			}).append(
				$('<td>', {
					style: 'text-align: center;'
				}).append(
					$('<span>', {
						class: 'kintoneplugin-input-checkbox-item',
					}).append(
						$('<input>', {
							type: 'checkbox',
							id: 'check-tyokko'
						})
					).append(
						$('<label>', {
							style: 'font-weight:bold;' +
								'margin-right:30px',
							for: 'check-tyokko',
							text: '直行'
						})
					)
				)
			).append(
				$('<td>', {
					style: 'text-align: center;'
				}).append(
					$('<span>', {
						class: 'kintoneplugin-input-checkbox-item',
					}).append(
						$('<input>', {
							type: 'checkbox',
							id: 'check-tyokki'
						})
					).append(
						$('<label>', {
							style: 'font-weight:bold;' +
								'margin-right:30px',
							for: 'check-tyokki',
							text: '直帰'
						})
					)
				)
			)

			var $tr3 = $('<tr>', {
				style: 'height: 50px;',
				id: 'tr-tikokuSoutai'
			}).append(
				$('<td>', {
					style: 'text-align: center;'
				}).append(
					$('<span>', {
						class: 'kintoneplugin-input-checkbox-item',
					}).append(
						$('<input>', {
							type: 'checkbox',
							id: 'check-tikokuyukyu'
						})
					).append(
						$('<label>', {
							style: 'font-weight:bold;',
							for: 'check-tikokuyukyu',
							text: '遅刻有給'
						})
					)
				)
			).append(
				$('<td>', {
					style: 'text-align: center;'
				}).append(
					$('<span>', {
						class: 'kintoneplugin-input-checkbox-item',
					}).append(
						$('<input>', {
							type: 'checkbox',
							id: 'check-soutaiyukyu'
						})
					).append(
						$('<label>', {
							style: 'font-weight:bold;',
							for: 'check-soutaiyukyu',
							text: '早退有給'
						})
					)
				)
			)

			//テーブル作成
			$table
				.append($tr1)
				.append($tr2)
				.append($tr3);

			//フォーム作成
			$frame
				.append($table)

			return $frame;
		}

		function createEventTimecard() {

			var loginUser = kintone.getLoginUser();

			var createRecordSagyonippo = createRecordSagyonippo_ippan;
			$('#button-syukkin').off().on('click', function() {
				$('#button-syukkin').off();
				if(validateCheck('syukkin')) {
					createRecordTimecard('syukkin').then(function(respTimecard) {
						createRecordSagyonippo('syukkin').then(function(respSagyonippo) {
							restApiCreateRecord('syukkin', {respSagyonippo:respSagyonippo, respTimecard:respTimecard});
						});
					});
				} else {
					window.location.reload();
				}
			});

			$('#button-taikin').off().on('click',function() {
				$('#button-taikin').off();
				if(validateCheck('taikin')) {
					createRecordTimecard('taikin').then(function(respTimecard) {
						createRecordSagyonippo('taikin').then(function(respSagyonippo) {
							restApiCreateRecord('taikin', {respSagyonippo:respSagyonippo, respTimecard:respTimecard});
						});
					});
				} else {
					window.location.reload();
				}
			});

			$('#check-itinitiyasumi').off().on('change',function() {
				changeDisplay();
			});

			function validateCheck(type) {
				var validate = true;
				return validate;
			}

			function createRecordTimecard(type) {
				return new kintone.Promise(function (resolve, reject) {
					var timecardBody = {};
					var processType = '';
					var alertMsg = '';

					var getParam = {};
					getParam.app = APPINFO.タイムカード.APPID;
					getParam.query = '氏名 in ("' + loginUser.code + '") and ( 出勤日 = TODAY() or 退勤日 = TODAY() ) order by 作成日時 desc';
					var timecardRec = getRecords(getParam);

					if(timecardRec.length) {
						timecardRec = timecardRec[0];

						// 出勤時刻：あり
						// 退勤時刻：なし
						if(
							timecardRec['出勤時刻'].value &&
							!timecardRec['退勤時刻'].value
						) {
							if(type == 'syukkin') {
								processType = 'error';
								alertMsg = '（タイムカード）すでに出勤がされています。ご確認ください';
							}
							else if(type == 'taikin') {
								processType = 'put';
								setTaikinBody();
							}
						}
						// 出勤時刻：なし
						// 退勤時刻：あり
						else if(
							!timecardRec['出勤時刻'].value &&
							timecardRec['退勤時刻'].value
						) {
							processType = 'error';
							alertMsg = '（タイムカード）すでに退勤がされています。ご確認ください';
						}
						// 出勤時刻：あり
						// 退勤時刻：あり
						else if(
							timecardRec['出勤時刻'].value &&
							timecardRec['退勤時刻'].value
						) {
							if(type == 'syukkin') {
								processType = 'post';
								setSyukkinBody();
							}
							else if(type == 'taikin') {
								processType = 'error';
								alertMsg = '（タイムカード）出勤時刻が設定されていません。ご確認ください';
								// setTaikinBody();
							}
						}
						// 出勤時刻：なし
						// 退勤時刻：なし
						else if(
							!timecardRec['出勤時刻'].value &&
							!timecardRec['退勤時刻'].value
						) {
							if(type == 'syukkin') {
								processType = 'put';
								setSyukkinBody();
							}
							else if(type == 'taikin') {
								processType = 'error';
								alertMsg = '（タイムカード）出勤時刻が設定されていません。ご確認ください';
								// setTaikinBody();
							}
						}
					} else {
						if(type == 'syukkin') {
							processType = 'post';
							setSyukkinBody();
						}
						else if(type == 'taikin') {
							processType = 'error';
							alertMsg = '（タイムカード）出勤時刻が設定されていません。ご確認ください';
							// setTaikinBody();
						}
					}

					console.log(processType);
					resolve(setResolveParam());

					function setSyukkinBody() {
						timecardBody.氏名 = { value : [{ code : loginUser.code }] };
						timecardBody.出勤日 = { value : moment().format('YYYY-MM-DD') };
						timecardBody.出勤時刻 = { value : moment().format('HH:mm') };

						var checked = jQuery('#check-tyokko').prop("checked");
						if(checked) {
							timecardBody.直行 = { value : ['直行'] };
						}
					}

					function setTaikinBody() {
						timecardBody.氏名 = { value : [{ code : loginUser.code }] };
						timecardBody.退勤日 = { value : moment().format('YYYY-MM-DD') };
						timecardBody.退勤時刻 = { value : moment().format('HH:mm') };
				
						var checked = jQuery('#check-tyokki').prop("checked");
						if(checked) {
							timecardBody.直帰 = { value : ['直帰'] };
						} 
				
					}


					function setResolveParam() {
						return {
							processType : processType,
							alertMsg : alertMsg,
							timecardBody : timecardBody,
							timecardRec : timecardRec,
							appId : APPINFO.タイムカード.APPID
						}
					}
				});
			}

			function createRecordSagyonippo_ippan(type) {
				return new kintone.Promise(function (resolve, reject) {
					var checkTyokko = jQuery('#check-tyokko').prop("checked");
					var checkTikokuyukyu = jQuery('#check-tikokuyukyu').prop("checked");
					var checkTyokki = jQuery('#check-tyokki').prop("checked");
					var checkSoutaiyukyu = jQuery('#check-soutaiyukyu').prop("checked");

					var valueTyokko = [];
					var valueTikokuyukyu = [];
					var valueTyokki = [];
					var valueSoutaiyukyu = [];

					if(checkTyokko) valueTyokko = ['あり'];
					if(checkTikokuyukyu) valueTikokuyukyu = ['あり'];
					if(checkTyokki) valueTyokki = ['あり'];
					if(checkSoutaiyukyu) valueSoutaiyukyu = ['あり'];

					//START 2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）
					var getParam = {};
					getParam.app = APPINFO.営業日マスタ.APPID;
					getParam.query = '日付 = TODAY()';
					getParam.apiToken = APPINFO.営業日マスタ.APITOKEN;
					var work_types = getRecords(getParam);

					if (work_types.length == 0) {
						processType = 'error';
						alertMsg = '（作業日報）営業日マスタに今日の営業日が登録されていません';
						resolve(setResolveParam());
						return false;
					}
					//END  2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）

					var getParam = {};
					getParam.app = APPINFO.作業日報.APPID;
					getParam.query = '名前 in ("' + loginUser.code + '") and 日付 = TODAY() order by 作成日時 desc';
					var sagyonippoRec = getRecords(getParam);

					var sagyonippoBody = {};
					var processType = '';
					var alertMsg = '';
					// 作業日報あり
					if(sagyonippoRec.length) {
						sagyonippoRec = sagyonippoRec[0];

						// 出勤時刻：なし
						// 退勤時刻：なし
						// １日有給：あり
						// １日欠勤：なし
						// ||
						// 出勤時刻：なし
						// 退勤時刻：なし
						// １日有給：なし
						// １日欠勤：あり
						if(
							sagyonippoRec['１日有給'].value.length || sagyonippoRec['１日欠勤'].value.length
						) {
							processType = 'error';
							alertMsg = '（作業日報）すでに作業日報が作成されています。ご確認ください';
						}
						// 出勤時刻：あり
						// 退勤時刻：なし
						// １日有給：なし
						// １日欠勤：なし
						else if(
							sagyonippoRec['出勤時刻'].value &&
							!sagyonippoRec['退勤時刻'].value
						) {
							if(
								type == 'syukkin' ||
								type == 'itinitiyukyu' ||
								type == 'itinitikekkin'
							) {
								processType = 'error';
								alertMsg = '（作業日報）すでに出勤がされています。ご確認ください';
							}
							else if(type == 'taikin') {
								processType = 'put';
								//START 2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）
								var taikinJikan = moment().format('HH:mm');
								sagyonippoBody['退勤時刻'] = { value : taikinJikan };
								sagyonippoBody['直帰'] = { value : valueTyokki };
								sagyonippoBody['早退有給'] = { value : valueSoutaiyukyu };

								var workTime = calcWorkTime(
									moment().format('YYYY-MM-DD'),
									sagyonippoRec['出勤種別'].value,
									sagyonippoRec['出勤時刻'].value,
									taikinJikan);

								sagyonippoBody['勤務時間'] = { value : workTime['total'] };
								sagyonippoBody['残業時間'] = { value : workTime['over'] };
								sagyonippoBody['深夜勤務時間'] = { value : workTime['late'] };
								sagyonippoBody['遅刻時間'] = { value : workTime['late_start'] };
								sagyonippoBody['早退時間'] = { value : workTime['early_end'] };
								//END  2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）
							}
						}
						// 出勤時刻：なし
						// 退勤時刻：あり
						// １日有給：なし
						// １日欠勤：なし
						else if(
							!sagyonippoRec['出勤時刻'].value &&
							sagyonippoRec['退勤時刻'].value
						) {
							processType = 'error';
							alertMsg = '（作業日報）すでに退勤がされています。ご確認ください';
						}
						// 出勤時刻：あり
						// 退勤時刻：あり
						// １日有給：なし
						// １日欠勤：なし
						else if(
							sagyonippoRec['出勤時刻'].value &&
							sagyonippoRec['退勤時刻'].value
						) {
							if(type == 'syukkin') {
								processType = 'post';
								sagyonippoBody['出勤時刻'] = { value : moment().format('HH:mm') };
								sagyonippoBody['直行'] = { value : valueTyokko };
								sagyonippoBody['遅刻有給'] = { value : valueTikokuyukyu };
								//START 2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）
								sagyonippoBody['出勤種別'] = { value : work_types[0].出勤種別.value };
								//END  2021.03.01 【新規】勤怠時間等算出処理　担当：武川（REP）
							}
							else if(type == 'taikin') {
								processType = 'error';
								alertMsg = '（作業日報）出勤時刻が設定されていません。ご確認ください';
							}
							else if(type == 'itinitiyukyu') {
								processType = 'post';
								sagyonippoBody['１日有給'] = { value : ['あり'] };
							}
							else if(type == 'itinitikekkin') {
								processType = 'post';
								sagyonippoBody['１日欠勤'] = { value : ['あり'] };
							}
						}
						// 出勤時刻：なし
						// 退勤時刻：なし
						// １日有給：なし
						// １日欠勤：なし
						else if(
							!sagyonippoRec['出勤時刻'].value &&
							!sagyonippoRec['退勤時刻'].value
						) {
							if(type == 'syukkin') {
								processType = 'put';
								sagyonippoBody['出勤時刻'] = { value : moment().format('HH:mm') };
								sagyonippoBody['直行'] = { value : valueTyokko };
								sagyonippoBody['遅刻有給'] = { value : valueTikokuyukyu };
								sagyonippoBody['出勤種別'] = { value : work_types[0]['出勤種別'].value };
							}
							else if(type == 'taikin') {
								processType = 'error';
								alertMsg = '（作業日報）出勤時刻が設定されていません。ご確認ください';
							}
							else if(type == 'itinitiyukyu') {
								processType = 'put';
								sagyonippoBody['１日有給'] = { value : ['あり'] };
							}
							else if(type == 'itinitikekkin') {
								processType = 'put';
								sagyonippoBody['１日欠勤'] = { value : ['あり'] };
							}
						}
					} else {
						if(type == 'syukkin') {
							processType = 'post';
							sagyonippoBody['出勤時刻'] = { value : moment().format('HH:mm') };
							sagyonippoBody['直行'] = { value : valueTyokko };
							sagyonippoBody['遅刻有給'] = { value : valueTikokuyukyu };
							sagyonippoBody['出勤種別'] = { value : work_types[0]['出勤種別'].value };
						}
						else if(type == 'taikin') {
							processType = 'error';
							alertMsg = '（作業日報）出勤時刻が設定されていません。ご確認ください';
						}
						else if(type == 'itinitiyukyu') {
							processType = 'post';
							sagyonippoBody['１日有給'] = { value : ['あり'] };
						}
						else if(type == 'itinitikekkin') {
							processType = 'post';
							sagyonippoBody['１日欠勤'] = { value : ['あり'] };
						}
					}

					resolve(setResolveParam());

					function setResolveParam() {
						return {
							processType : processType,
							alertMsg : alertMsg,
							sagyonippoBody : sagyonippoBody,
							sagyonippoRec : sagyonippoRec,
							appId : APPINFO.作業日報.APPID
						}
					}

				});
			}

			function restApiCreateRecord(type, respObj) {
				var respSagyonippo = respObj.respSagyonippo;
				var respTimecard = respObj.respTimecard;


				var requests = [];
				var alertMsg = [];

				if(type == 'itinitiyukyu' || type == 'itinitikekkin' ) {
					if(respSagyonippo.processType == 'post') {
						createBulkRequestBody('POST', respSagyonippo.appId, [respSagyonippo.sagyonippoBody], requests);
					}
					else if(respSagyonippo.processType == 'put') {
						createBulkRequestBody('PUT', respSagyonippo.appId, [{id: respSagyonippo.sagyonippoRec.$id.value, record:respSagyonippo.sagyonippoBody}], requests);
					}

					if(respSagyonippo.alertMsg) alertMsg.push(respSagyonippo.alertMsg);

				} else {
					if(respSagyonippo.processType != 'error' && respTimecard.processType != 'error') {
						if(respSagyonippo.processType == 'post') {
							createBulkRequestBody('POST', respSagyonippo.appId, [respSagyonippo.sagyonippoBody], requests);
						}
						else if(respSagyonippo.processType == 'put') {
							createBulkRequestBody('PUT', respSagyonippo.appId, [{id: respSagyonippo.sagyonippoRec.$id.value, record:respSagyonippo.sagyonippoBody}], requests);
						}

						if(respTimecard.processType == 'post') {
							createBulkRequestBody('POST', respTimecard.appId, [respTimecard.timecardBody], requests);
						}
						else if(respTimecard.processType == 'put') {
							createBulkRequestBody('PUT', respTimecard.appId, [{id: respTimecard.timecardRec.$id.value, record:respTimecard.timecardBody}], requests);
						}
					}

					if(respSagyonippo.alertMsg) alertMsg.push(respSagyonippo.alertMsg);
					if(respTimecard.alertMsg) alertMsg.push(respTimecard.alertMsg);
				}


				bulkRequest(requests).then(function () {
					if(alertMsg.length) {
						alert(alertMsg.join('\n'));
						window.location.reload();
					} else {
						alert('完了');
						window.location.reload();
					}
				}).catch(function (error) {
					return errorEnd(new Error('予期せぬエラーが発生しました。'));
				});
			}

			function changeDisplay(){
				if($('#check-itinitiyasumi').prop('checked')){
					$('#tr-yukyuKekkin').css('display','');
				}else{
					$('#tr-yukyuKekkin').css('display','none');
				}
			}
		}
	}


})(jQuery);