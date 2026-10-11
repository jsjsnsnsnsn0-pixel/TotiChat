/* TotiChat static review extension: preserve final artwork; no backend effects. */
(function(){
'use strict';
if(typeof render!=='function'||typeof go!=='function'||typeof page!=='function')return;
const groups=[
['بدء الاستخدام',[['🔐','تسجيل الدخول','loginPreview'],['🆕','إنشاء حساب','signupPreview'],['🔑','استعادة كلمة المرور','passwordResetPreview'],['📩','تأكيد البريد','verifyAccountPreview']]],
['الرئيسية والاكتشاف',[['🏠','الرئيسية','home'],['🧭','اكتشف','discoverPreview'],['🗺️','الخريطة','tour'],['🏆','التصنيفات','ranks'],['🎯','المهام','missionsPreview'],['🧰','الكنز','treasurePreview'],['🔔','الإشعارات','notificationsPreview'],['🎁','مكافأة التسجيل','welcomePreview']]],
['الغرف الصوتية',[['🎙️','الغرفة','room'],['🛡️','إدارة الغرفة','roomAdminPreview'],['🎮','الألعاب','gamesPreview'],['🎵','الموسيقى','musicPreview'],['🎁','الهدايا','giftsPreview']]],
['التواصل',[['💬','الرسائل','messages'],['✉️','الدردشة الخاصة النصية','chatPreview'],['👥','الأصدقاء','friendsPreview']]],
['الملف الشخصي',[['👤','حسابي','me'],['🪪','البروفايل','profilePreview'],['✏️','تعديل الملف','profileEdit'],['⚙️','الإعدادات','settings'],['🌐','اللغة','languages'],['🚫','الحظر','block'],['📝','الإبلاغ','report'],['💠','المستوى','level'],['🏅','الميداليات','honor'],['🎒','التخزين','storage'],['🛍️','الحقيبة','bagPreview'],['👑','VIP 1–10','vip']]],
['المال والعلاقات',[['🪙','المحفظة','wallet'],['💳','الشحن','rechargePreview'],['🏪','المتجر','storePreview'],['💗','CP','cp']]],
['الوكالات',[['🏆','مسابقة الوكالة','agency'],['🏢','مركز الوكالات','agencyPreview'],['📄','طلب وكالة','agencyApply'],['📋','حالة طلب الوكالة','agencyStatusPreview'],['🤝','الانضمام للوكالة','agencyJoinPreview']]]
];
const dialogs=[
['🎁','الهدايا','gift'],['🎙️','معلومات الغرفة','roomInfo'],['🔄','الخروج والتصغير','roomExitMenu'],['🌍','الدول','countries'],['🎛️','الأدوات','tools'],['🎮','ألعاب الغرفة','games'],['👤','بطاقة مستخدم','user:0'],
['➕','إنشاء غرفة','create'],['🔎','البحث','search'],['🌟','مكافأة التسجيل','promo'],['📣','الإعلان الرسمي','announcement'],['🎉','الفعالية','event'],['🏆','مكافأة الوكالة','agencyRewards'],['💗','مكافآت CP','cpReward'],
['📶','إصلاح الشبكة','network'],['💬','رسائل الغرفة الكتابية','chatInput'],['✏️','تعديل الملف','edit'],['📨','رسائل الغرفة','messagesRoom'],['👜','تفاصيل منتج','item:0'],['🏅','تفاصيل وسام','medal:0'],
['🪙','رصيد VIP','vipLowBalance'],['👑','تأكيد VIP','vipPurchasePreview'],['✨','مميزات VIP','vipMoreDetails'],['🖼️','إطار VIP','vipPerkDetail:إطار VIP'],['💳','تفاصيل الشحن','rechargeSummary'],['💎','تحويل الماس','diamondsPreview'],['🤝','الانضمام لوكالة','agencyJoin']
];
const routes=groups.flatMap(g=>g[1].map(r=>r[2]));
if(routes.length!==41||new Set(routes).size!==41||dialogs.length!==27)throw Error('Inventory mismatch');
const accepted=new Set(routes);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const beforeRender=render;
render=function(){
if(screen==='passwordResetPreview'||screen==='verifyAccountPreview'){
const recovery=screen==='passwordResetPreview';
const title=recovery?'استعادة كلمة المرور':'تأكيد البريد الإلكتروني';
const fields=recovery?
'<label>البريد الإلكتروني<input type="email" name="email" autocomplete="email" required placeholder="name@example.com"></label>':
'<label>البريد الإلكتروني<input type="email" name="email" autocomplete="email" required placeholder="name@example.com"></label><label>رمز التأكيد<input name="otp" inputmode="numeric" maxlength="8" pattern="[0-9]{6,8}" required placeholder="000000"></label>';
document.getElementById('app').innerHTML=page(title,'<section style="min-height:80dvh;background:linear-gradient(140deg,#f8fff0,#d8f5e8);padding:17px" dir="rtl"><div class="cardwhite" style="padding:21px;border-radius:20px;color:#265c47"><h2 style="color:#087d67;text-align:center">'+(recovery?'🔑':'📩')+' '+title+'</h2><p> '+(recovery?'استعد الوصول إلى حسابك بأمان':'تحقق من بريدك الإلكتروني وأكمل التسجيل')+'</p><form data-review-auth style="display:grid;gap:14px;margin-top:17px">'+fields+'<button class="primary" type="submit">'+(recovery?'معاينة إرسال رابط الاستعادة':'معاينة تأكيد البريد')+'</button></form><p style="font-size:12px;margin-top:18px">هذه معاينة بصرية فقط؛ لن يُرسل بريد أو رمز فعلي.</p><button class="listrow" data-review-route="loginPreview">الرجوع لتسجيل الدخول ‹</button></div></section>');
document.documentElement.classList.remove('in-room');document.body.style.background='#dfffee';window.scrollTo(0,0);return;
}
const result=beforeRender.apply(this,arguments);
if(screen==='loginPreview'){
const target=document.querySelector('#app .cardwhite');
if(target&&!target.querySelector('[data-review-route="passwordResetPreview"]')){
const b=document.createElement('button');b.className='listrow';b.dataset.reviewRoute='passwordResetPreview';b.textContent='🔑 نسيت كلمة المرور؟';target.appendChild(b);
}
}
if(screen==='signupPreview'){
const target=document.querySelector('#app .cardwhite');
if(target&&!target.querySelector('[data-review-route="verifyAccountPreview"]')){
const b=document.createElement('button');b.className='listrow';b.dataset.reviewRoute='verifyAccountPreview';b.textContent='📩 معاينة تأكيد البريد';target.appendChild(b);
}
}
return result;
};
vNav=function(){
const category=groups.map(g=>'<h2 class="tour-title">'+esc(g[0])+'</h2><div class="tour-grid">'+g[1].map(r=>'<button data-review-route="'+esc(r[2])+'"><em>'+r[0]+'</em><b>'+esc(r[1])+'</b><small>فتح الشاشة ›</small></button>').join('')+'</div>').join('');
const windows='<h2 class="tour-title">النوافذ والوظائف الفرعية (27)</h2><div class="tour-grid">'+dialogs.map(r=>'<button data-review-dialog="'+esc(r[2])+'"><em>'+r[0]+'</em><b>'+esc(r[1])+'</b><small>فتح النافذة ›</small></button>').join('')+'</div>';
return page('خريطة المعاينة الكاملة','<div class="cardwhite" style="margin:12px;padding:12px;color:#23624e"><b>41 شاشة + 27 نافذة فرعية</b><p>هذه معاينة بصرية مستقلة؛ لا تخصم عملات ولا تغيّر بيانات أي حساب.</p></div>'+category+windows);
};
document.addEventListener('click',event=>{
const r=event.target.closest('[data-review-route]');
if(r){const id=r.dataset.reviewRoute;if(accepted.has(id)){event.preventDefault();go(id)}return;}
const dialog=event.target.closest('[data-review-dialog]');
if(dialog){event.preventDefault();sheet(dialog.dataset.reviewDialog);}
});
document.addEventListener('submit',event=>{
const form=event.target.closest('[data-review-auth]');
if(form){event.preventDefault();if(form.reportValidity())showToast('معاينة فقط — لم نرسل رمزاً ولم نغيّر أي حساب');}
});
window.TotiChatVisualInventory=Object.freeze({screens:routes.slice(),dialogs:dialogs.map(d=>d[2]),count:routes.length,windowCount:dialogs.length});
const deepLink=new URLSearchParams(location.search).get('screen');
if(accepted.has(deepLink))screen=deepLink;
render();
})();