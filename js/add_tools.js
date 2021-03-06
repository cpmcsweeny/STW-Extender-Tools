jQuery(document).ready(function ($) {
    var users
        , showText = "<p class='showLink' style='cursor:pointer; color:#333; text-decoration:underline;'>Show this post</p>"
        ,showSomeonePosted
		,appendQuotes
		,quoteVerb
		,signature;

    function stringToBool(value) {
        return value === 'true';
    }
        
    function hidePosts() {
        $('.bbp-author-name').each(function () {
            var $parent = $(this).parent().parent()
                , $post = $parent.children('.bbp-reply-content')
				, user = $(this).text();
            
            if (users && users.indexOf(user) !== -1) {
				$(this).parent().append("&emsp;<span class='unblockUser' style='display:inline; cursor:pointer; color:#333; text-decoration:underline;'>Unblock User</span>");
				if (showSomeonePosted) {
                    $parent.hide();
                    $parent.after("<p class='showLink' style='cursor:pointer; color:#333; text-decoration:underline;'>Show post from " + user + "</p" );
                } else {
                    $parent.hide();
                }
				
            } else {
				$(this).parent().append("&emsp;<span class='hideUser' style='display:inline; cursor:pointer; color:#333; text-decoration:underline;'>Block User</span>");
			}
        });
            
        $(document).on("click", ".showLink", function () {
            $(this).parent().children().fadeIn();
            $(this).remove();
        });

     
        $(document).on("click", ".hideUser", function () {
			$(this).attr('class', 'unblockUser');
			$(this).text('Unblock User');
            var user = $(this).parent().children('.bbp-author-name').text();
            if (users.indexOf(user) === -1) {
                chrome.runtime.sendMessage({msg: 'hide_user', username: user}, function (response) {
                    users = response.result.users;              
                });
			}
            var $parent = $(this).parent().parent()
                , $post = $parent.children('.bbp-reply-content');
            if (showSomeonePosted) {
                $parent.fadeOut();
                $parent.after("<p class='showLink' style='cursor:pointer; color:#333; text-decoration:underline;'>Show post from " + user + "</p" );
            } else {
                $post.fadeOut();
            }
        });
		
        $(document).on("click", ".unblockUser", function () {
			$(this).attr('class', 'hideUser');
			$(this).text('Block User');
            var user = $(this).parent().children('.bbp-author-name').text();
            if (users.indexOf(user) != -1) {
                chrome.runtime.sendMessage({msg: 'unblock_user', username: user}, function (response) {
                    users = response.result.users;              
                });
			}
        });		
    }
   
    function hideThreads() {
        $('.bbp-author-name').each(function () {
            if (users.indexOf($(this).text()) !== -1) {
                $(this).parent().parent().hide();
            }
        });
    }
	
	function unNestQuotes(element) {
		return element.map(function(){
			if ($(this).is('blockquote') || $(this).hasClass('bbcode-quote'))
				return '<blockquote>' + unNestQuotes($(this).children()) + '</blockquote>';
			return $(this).text(); 
		}).get().join('\n');
	}
    
    function addEasyQuotes() {
        $('.bbp-reply-author').append("&emsp;<span class='easyQuote' style='display:inline; cursor:pointer; color:#333; text-decoration:underline;'>Quote</span>");
            
        $(document).on("click", ".easyQuote", function () {
            var $parent = $(this).parent().parent()
                , $post = $parent.children('.bbp-reply-content').children('p, blockquote, .bbcode-quote')
				, user = $(this).parent().children('.bbp-author-name').text()
                , quote;

            quote = '[b]' + user + '[/b] ' + quoteVerb + ':<blockquote>' + unNestQuotes($post) + '</blockquote>\n\n';
            
				if (appendQuotes) {
					quote = $('#bbp_reply_content').val() + '\n' + quote;
				}
				$('#bbp_reply_content').val(quote);
				document.getElementById('bbp_reply_content').focus();

        });  
    }

	function backToForumTops() {
		$('ol#thread').after ( "Return to <a href=\"/forum/\">Overview</a> <a href=\"/forum/forum/bike-chat\">Bike Forum</a> <a href=\"/forum/forum/off-topic\">Chat Forum</a>" );
	}
	
	function addSignature() {
		if ( signature != null && signature != '') {
			$('#bbp_reply_submit').click(function () {
				var  $form = $(this).parent().parent()
					,$text = $form.find('#bbp_reply_content').val();
				$('#bbp_reply_content').val($text + '\n' + signature);
			});
		}
	}
	
	function addThreadRedirects() {
		$(document).on("click", ".bbp-reply-post-date", function () {
			var url = 'http://singletrackworld.com/forum/reply/' + $(this).parent().attr('href').substr(6) + '/';
			chrome.runtime.sendMessage({msg: 'xget', url: url, data: '' }, function (response) {
				var urlResponse = $($.parseHTML(response)).find('.bbp-breadcrumb-topic').attr('href');
				chrome.runtime.sendMessage({msg: 'redirect', redirect: urlResponse});
			});
		});		
	}
	
	function fixEditLinks() {
		$('.bbp-reply-edit-link').each(function() {
			$(this).attr('href', 'http://singletrackworld.com/forum/reply/' +
				$(this).parent().prev().attr('href').substr(6) + '/edit/');
		});
	}
    
	function addEditLinks() {
		var myUsername = $('.account-menu').text();
		$('.bbp-author-name').each(function() {
			if ($(this).text() == myUsername) {
				var adminLinks = $(this).parent().siblings('.bbp-reply-content').children('.bbp-admin-links');
				if (!adminLinks.children().is('.bbp-reply-edit-link')) {
					adminLinks.prepend('<a href="http://singletrackworld.com/forum/reply/' +
						adminLinks.prev().attr('href').substr(6) +
						'/edit/" class="bbp-reply-edit-link">Edit</a> | ');
				}
			}

		});
	}
    
    chrome.runtime.sendMessage({msg: 'get_options'}, function (response) {
        users = response.result.users;
        showSomeonePosted = stringToBool(response.result.showSomeonePosted);
		quoteVerb = response.result.quoteVerb;
        if ((quoteVerb === undefined) || (quoteVerb === "")) {
            quoteVerb = 'wrote';
        }
		appendQuotes = stringToBool(response.result.enableAppendQuotes);
		signature = response.result.signature;
        var isTopic = document.URL.indexOf('forum/topic/') != -1;
        var isReplies = document.URL.indexOf('forums/replies/') != -1;
        if (stringToBool(response.result.enableHideUsers) && isTopic) {
            hidePosts();
        }
        if (stringToBool(response.result.enableHideThreads) && users && !isTopic && !isReplies) {
            hideThreads();
        }
		if (isReplies) {
			addThreadRedirects();
		}
//		if (isTopic) {
//			fixEditLinks();
//		}
        if (stringToBool(response.result.enableAddEdit) && isTopic) {
            addEditLinks();
        }
        if (stringToBool(response.result.enableEasyQuoting) && isTopic) {
            addEasyQuotes();
        }
		if (stringToBool(response.result.enableSignature) && isTopic) {
			addSignature();
        }
		backToForumTops();

    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg === 'add_quote') {
		$('#post_content').val(request.quotetext);
	}
});
