/*
TODO: 
- Make the totals show in full profiles
- Make the small prize img use a scaled-down version of the large img
LATER: Focus on "What's it gonna be?!" mechanics -- containers explode when clicked
*/

function show_leaderboard(){
	var html = "";
	var leaderboard = pb.plugin.key('sh_leaderboard').get();
	var $content = $("#content");
	var html_decode = function(str){

		return str.toString().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

	};

	html += "<div class=\"scavenger-hunt-leaderboard container\">";
	html += "<div class=\"title-bar\"><h2>Scavenger Hunt Leaderboard</h2></div>";
	html += "<div class=\"content pad-all\">";

	if(Array.isArray(leaderboard) && leaderboard.length > 0){
		leaderboard.sort(function(a, b){
			if(a.count > b.count){
				return -1;
			}
			if(a.count < b.count){
				return 1;
			}
			return 0;
		});

		for(var i = 0; i < leaderboard.length; ++ i){
			html += "<div class='scavenger-hunt-leaderboard-item'><span class=\"shlb-rank-" + (i+1) + "\">(" + (i+1) + ")</span> <a href='/user/" + parseInt(leaderboard[i].id, 10) + "'>" + pb.text.escape_html(html_decode(leaderboard[i].name)) + "</a> ( <strong>" + pb.text.escape_html(leaderboard[i].count) + "</strong> )</div>";
		}
	} else {
		html += "Leaderboard is currently empty.";
	}

	html += "</div></div>";

	$content.append(html);
}

function add_profile_staff_clear_button(route){
	if(!pb.data("user").is_logged_in || !pb.data("user").is_staff){
		return;
	} 
	
	if(route.name == "user"){
		var user_id = parseInt(route.params.user_id, 10);
		var button = $('<a class="button scavenger-hunt-clear" href="#" role="button">Clear Scavenger Hunt Data</a>');
		var $dialog = $("<div id='scavenger-hunt-clear-dialog' style='display: none'>Are you sure you want clear this users scavenger count (including leaderboard entry)?</div>");
		
		$dialog.appendTo($("body"));
		
		button.on("click", function(){
			
			$dialog.dialog({
			
				title: "Confirm",
				modal: true,
				autoOpen: true,
				height: 200,
				width: 350,
				buttons: {
				
					"Clear Data": function(){
						pb.plugin.key("sh_obj_amount").set({
					
							object_id: user_id,
							value: 0
							
						});
					
						var leaderboard = pb.plugin.key("sh_leaderboard").get() || [];
						var has_user = false;

						for(i = 0; i < leaderboard.length; ++i) {
							if(leaderboard[i].id == user_id) {
								leaderboard.splice(i, 1);
								
								break;
							}
						}
						
						pb.plugin.key("sh_leaderboard").set({
						
							value: leaderboard
							
						});
						
						$dialog.dialog("close");
						pb.window.alert("Scavenger Data", "Scavenger data cleared");
					},
					
					"Cancel": function(){
						$dialog.dialog("close");
					}			
				
				}
			
			});
			
			return false;
		});
		
		$(".controls").prepend(button);
	}
}

$(document).ready(function() {

	var halloweenFeatures = pb.plugin.get('scavenger_hunt').settings.halloween_features;
	var userID = parseInt(pb.data('user').id, 10);
	var userName = pb.data('user').username;
	var userprizeBag = pb.plugin.key('sh_obj_amount').get(userID);
	var route = pb.data("route");

	add_profile_staff_clear_button(route, userID);
	
	// Show leaderboard on a new page with an id of "scavenger-hunt"

	if(route && route.params && route.params.page_id == "scavenger-hunt"){
		show_leaderboard();
	}
    
    if(pb.plugin.get('scavenger_hunt').settings.sh_m_mode == 1) {
        return;
    }

	if (userprizeBag === null) {
		userprizeBag = 0
	};

	var manyItems = 0;
	var hasAmount = 20;
	var range = 6;
	var frequency = 2;
	var pr_det_avail = 2;

	if (!pb.plugin.get('scavenger_hunt').settings.multiple_items || parseInt(pb.plugin.get('scavenger_hunt').settings.multiple_items) == 0) {
		manyItems = 0;
	}
	else {
		manyItems = parseInt(pb.plugin.get('scavenger_hunt').settings.multiple_items);
	}

	if (!pb.plugin.get('scavenger_hunt').settings.collected || parseInt(pb.plugin.get('scavenger_hunt').settings.collected < 1)) {
		hasAmount = 20;
	}
	else {
		hasAmount = parseInt(pb.plugin.get('scavenger_hunt').settings.collected);
	}

	if (!pb.plugin.get('scavenger_hunt').settings.random_amount_max || parseInt(pb.plugin.get('scavenger_hunt').settings.random_amount_max < 1)) {
		range = 6;
	}
	else {
		range = parseInt(pb.plugin.get('scavenger_hunt').settings.random_amount_max);
	}

	if (!pb.plugin.get('scavenger_hunt').settings.frequency || parseInt(pb.plugin.get('scavenger_hunt').settings.frequency < 2)) {
		frequency = 2;
	}
	else {
		frequency = parseInt(pb.plugin.get('scavenger_hunt').settings.frequency);
	}

	if (!pb.plugin.get('scavenger_hunt').settings.prize_detector_available) {
		pr_det_avail = 5;
	}
	else if (parseInt(pb.plugin.get('scavenger_hunt').settings.prize_detector_available) < 2) {
		pr_det_avail = 2;
	}
	else {
		pr_det_avail = parseInt(pb.plugin.get('scavenger_hunt').settings.prize_detector_available);
	}


	//FUNCTIONS

	//ITEM FOUND
	function clickprize() {
		if (userID != 0) {

			// Store default permissions for the user, though if guest, set to no write

			var permission_path = proboards.plugin.keys.permissions.sh_obj_amount;
			var user_id = parseInt(proboards.data("user").id, 10);
			var user_read_write_entry = permission_path[user_id] || [1, 0];

			// Before updating the key reset the permissions array for the user

			if (permission_path[user_id]) {
				permission_path[user_id] = user_read_write_entry;
			}

			$(this).remove();

			//Current user's candy totals
			var dataCheck = pb.plugin.key('sh_obj_amount').get(userID);

			//If data exists for this user, increment. Otherwise,
			if (typeof dataCheck !== 'undefined') {
				var intprizeBag = parseInt(userprizeBag);
				var incrementNum;

				//If user has unlocked prize cloner, prize pickups can now range from 1 to x
				if (userprizeBag >= hasAmount && (halloweenFeatures == 1 || manyItems == 1)) {
					incrementNum = Math.floor(Math.random() * range) + 1;
				} else {
					incrementNum = 1;
				}

				var dbCheck = intprizeBag + incrementNum;

				pb.plugin.key('sh_obj_amount').increment({
					object_id: userID,
					value: parseInt(incrementNum) || 1
				});
			} else {
				pb.plugin.key('sh_obj_amount').set({
					object_id: userID,
					value: 1
				});
			}

			//Find current user's mini profile and increment count
			var prizeBagNumber = parseInt($('.userBag-' + userID).first().find('.prizeNum').text());
			var newNum = incrementNum + prizeBagNumber;

			$('.userBag-' + userID).find('.prizeNum').text(newNum);
			$('#sh_mp_md').html($('.userBag-' + userID).find('.prizeNum').text(newNum));

			if (typeof incrementNum == "undefined") {
				incrementNum = 1;
				dbCheck = 1;
			}

			incrementNum = parseInt(incrementNum) || 1;

			var leaderboard = pb.plugin.key('sh_leaderboard').get();

			if(!Array.isArray(leaderboard)){
				leaderboard = [];
			}

			var has_user = false;

			for(i = 0; i < leaderboard.length; ++i) {
				if(leaderboard[i].id == userID) {
					leaderboard[i].count = dbCheck;
					has_user = true;
					break;
				}
			}

			if(!has_user){
				leaderboard.push({
					name: pb.data('user').name,
					id: userID,
					count: dbCheck
				});
			}

			pb.plugin.key('sh_leaderboard').set({
				value: leaderboard
			});

			proboards.alert(pb.plugin.get('scavenger_hunt').settings.object_name + " found!", "<img style='float:left; padding:15px; padding-right:20px;' src='" + pb.plugin.get('scavenger_hunt').settings.chest_image + "'><span style>" + pb.plugin.get('scavenger_hunt').settings.win_text + "<br><br><center><b>+" + incrementNum + " " + pb.plugin.get('scavenger_hunt').settings.prize_name_plural + "!<br>" + dbCheck + " " + pb.plugin.get('scavenger_hunt').settings.prize_name_plural + " in your " + pb.plugin.get('scavenger_hunt').settings.container_name + " now!</b></center></span>");
			$('.prizeDetector').removeClass('active').attr('src', pb.plugin.get('scavenger_hunt').settings.prize_detector_deactivated_image);
		} else {
			//User is not logged in

			proboards.alert("You need to log in!", "<img style='float:left; padding:15px; padding-right:20px;' src='" + pb.plugin.get('scavenger_hunt').settings.object_image + "'><span style>Darn... you found a " + pb.plugin.get('scavenger_hunt').settings.object_name + ", but you don't have a bag to put it in! <br><br>Log in or register to start your collection!</span>");
		}
	}

	function clickprizeDetector() {
		if ($(this).hasClass('active')) {
			proboards.alert("prize Detector", "<img style='float:left; padding:15px; padding-right:20px;' src='" + pb.plugin.get('scavenger_hunt').settings.prize_detector_activated_image + "'>prize detected nearby! Look around!");
		} else {

			proboards.alert("prize Detector", "<img style='float:left; padding:15px; padding-right:20px;' src='" + pb.plugin.get('scavenger_hunt').settings.prize_detector_deactivated_image + "'>No prize detected nearby. Better move on!");
		}
	}

	function clickBag() {
		var prizeNum = $(this).find(".prizeNum").text();
		var userName = $(this).parent().find(".user-link").text();
		proboards.alert("Trick or treat!", "<img style='float:left; padding:15px; padding-right:20px;' src='" + pb.plugin.get('scavenger_hunt').settings.container_image_url + "'>" + pb.text.escape_html(prizeNum) + " " + pb.plugin.get('scavenger_hunt').settings.prize_name_plural + " in " + pb.text.escape_html(userName) + "'s bag!<br><br>" + pb.plugin.get('scavenger_hunt').settings.container_text);
	}

	/*
	Scavenger prize == User finds and clicks on item
	prize detector == User clicks on prize detector
	prize bag ==  User clicks on prize bag
	*/

	function bindFunctions() {
		$('body').on('click', '.scavengerPrize', clickprize);
		$('body').on('click', '.prizeDetector', clickprizeDetector);
		$('body').on('click', '.prizeBag', clickBag);
	}

	function unbindFunctions() {
		$("body").off("click", ".scavengerPrize", clickprize);
		$("body").off("click", ".prizeDetector", clickprizeDetector);
		$("body").off("click", ".prizeBag", clickBag);
	}

	//END FUNCTIONS

	//Random chance to show prize inside a thread
	function rollTheDice(oddsModifier) {
		bindFunctions();
		var userID = proboards.data('user').id;

		if (oddsModifier == 4) {} else if (typeof(proboards.data('page').thread) !== "undefined") {
			oddsModifier = frequency;
		} else {
			oddsModifier = frequency + 1;
		}
		var odds = Math.floor(Math.random() * oddsModifier);
		// Change odds based on type of page

		if (odds === 0) {
			var prizeSize = ((Math.random() * 100) + 50).toFixed();
			//Create prize element, assign image from plugin settings
			var prizeItem = $('<div class="prizeContainer"><img class="scavengerPrize levitate" src="' + pb.plugin.get('scavenger_hunt').settings.object_image + '"></div>');

			// Generate random coordinates within document boundaries, .toFixed for note rounding
			var posx = (Math.random() * ($(document).width() - prizeSize)).toFixed();
			var posy = (Math.random() * ($(document).height() - prizeSize)).toFixed();

			//Position prize item randomly on the page
			$(prizeItem).css({
				'position': 'absolute',
				'left': posx + 'px',
				'top': posy + 'px',
			}).appendTo('body');

			//prize DETECTOR FUNCTIONS
			//prize on this page!
			prizeDetectorSwitch(true);

			// Sorry, no prize on this page.
		} else {
			prizeDetectorSwitch(false);
		}

		//Add prize bag to profiles
		var paperBag = $('<div class="prizeBag"><img src="' + pb.plugin.get('scavenger_hunt').settings.container_image_url + '"><div class="prizeCountContainer"><span class="prizeCount"><span class="prizeNum">0</span> <img class="prizeIcon" src="' + pb.plugin.get('scavenger_hunt').settings.small_prize_image_url + '"></span></div></div>');
		var userData = [];

		//Build array of current user IDs, so we can make the necessary plugin key calls
		$('.mini-profile').each(function() {
			var userIDHref = $(this).find('.user-link').attr('href');

			//if not guest
			if (typeof userIDHref !== "undefined") {

				//arr[2] will output user's ID
				var arr = userIDHref.split('/');

				//If current user is not already in the list, push em in
				if ($.inArray(arr[2], userData) == -1) {

					userData.push(arr[2]);

				}

			}

		});
		//Loop through every item of the built array of users on page
		$.each(userData, function(key, value) {
			var userID = parseInt(value, 10) || 0;
			var elemClone = $(paperBag).clone();

			if(!userID){
				return;
			}

			var candies = pb.plugin.key('sh_obj_amount').get(userID);

			// Place prize bag on mini-profile of each user in array
			$('.user-' + value).parent().find('.avatar').after(elemClone);

			//User's prize is hopefully a gosh dang number and not and object
			if (typeof candies != 'object') {
				$('.user-' + value).parent().find('.prizeNum').text(candies);
			}
			$('.user-' + value).parent().find('.prizeBag').addClass('userBag-' + value);
		});

		//If user unlocked prize detector, initialize it
		function prizeDetectorSwitch(onOff) {
			var prizeDetector;

			if (userprizeBag >= pr_det_avail) {

				if (onOff == 1) {
					prizeDetector = $('<a><img class="prizeDetector active" src="' + pb.plugin.get('scavenger_hunt').settings.prize_detector_activated_image + '" alt="prize DETECTED NEARBY!" style="margin-top: 3px !important;display: inline-block;float: left !important;padding: 0px 3px !important;height: 16px !important;width: auto !important;"></a>');
					$(prizeDetector).prependTo('#pbn-bar');
					$('#pbn-bar').css('width','auto');
				}
				else {
					prizeDetector = $('<a><img class="prizeDetector" src="' + pb.plugin.get('scavenger_hunt').settings.prize_detector_deactivated_image + '" alt="No prize detected." style="margin-top: 3px !important;display: inline-block;float: left !important;padding: 0px 3px !important;height: 16px !important;width: auto !important;"></a>');
					$(prizeDetector).prependTo('#pbn-bar');
					$('#pbn-bar').css('width','auto');
				}
			}
		}

	}

	//On page load, run code with default odds
	var oddsModifierNumber = frequency;
	rollTheDice(oddsModifierNumber);

	//On page change event, rerun code
	proboards.on('pageChange', function() {

		//Reset everything
		$('.prizeContainer, .prizeDetector').remove();
		unbindFunctions();
		bindFunctions();

		//Halve odds, because changing pages is easy
		oddsModifierNumber = frequency * 2;
		rollTheDice(oddsModifierNumber);
	});

	//Message handler
	function alertMessage(title, image, text) {
		proboards.alert(title, "<img style='float:left; padding:15px; padding-right:20px;' src='" + image + "'>" + text);
	}

	//*** MESSAGES ***

	if (halloweenFeatures == 1) {
		var readMessages = pb.plugin.key('sh_alerts_config').get();
		if (typeof readMessages == "undefined") {
			readMessages = {
				a: 0,
				b: 0,
				c: 0
			}
		};

		//Message when user unlocks prize detector
		if (readMessages.a === 0 && userprizeBag >= 5) {
			alertMessage("You collected 5 " + pb.plugin.get('scavenger_hunt').settings.object_name + "", "http://dev.prbrds.com/d/c/BG1UDhPVdK.gif", "You find a strange object on the ground, and realize it's a prize detector! You quickly stow it inside your <b>ProBoards Toolbar</b>, in the lower right-hand corner.<br><br> Now, whenever there's a piece of prize on the page, your prize detector will come to life with a <b>spooky jack-o-lantern face!</b><br><br><center><img src='http://dev.prbrds.com/d/c/dfzbXu75BY.png'></center>");
			pb.plugin.key('sh_alerts_config').set({
				value: {
					a: 1,
					b: readMessages.b,
					c: readMessages.c
				}
			});
		}

		//Message when user unlocks thread tip
		else if (readMessages.b === 0 && userprizeBag >= 10) {
			alertMessage("You collected 10 " + pb.plugin.get('scavenger_hunt').settings.object_name + "", "http://dev.prbrds.com/d/c/BG1UDhPVdK.gif", "Your prize detector springs to life with a piece of advice for you.<br><br><i>'You're more likely to find prize when you're inside a thread!'</i>");
			pb.plugin.key('sh_alerts_config').set({
				value: {
					a: readMessages.a,
					b: 1,
					c: readMessages.c
				}
			})
		}

		//Message when user unlocks David message
		else if (readMessages.c === 0 && userprizeBag >= 15) {
			alertMessage("You collected 20 " + pb.plugin.get('scavenger_hunt').settings.object_name + "", "http://dev.prbrds.com/d/c/BG1UDhPVdK.gif", "Your prize detector springs to life with dark Halloween magic!<br><br><i>'You're not collecting enough prize! I'll help you find more.'</i><br><br>Now, when you pick up prize, you'll have a chance to find a lot more!");
			pb.plugin.key('sh_alerts_config').set({
				value: {
					a: readMessages.a,
					b: readMessages.b,
					c: 1
				}
			});
		}
	}

});
