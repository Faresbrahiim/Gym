/*
Author       : Dreamguys
Template Name: DreamSports - Bootstrap Template
Version      : 1.0
*/

(function($) {
    "use strict";

    // Sidebar
	
	if($(window).width() <= 991) {
		var Sidemenu = function() {
			this.$menuItem = $('.main-nav a');
		};

		function init() {
			var $this = Sidemenu;
			$('.main-nav a').on('click', function(e) {
				if($(this).parent().hasClass('has-submenu')) {
					e.preventDefault();
				}
				if(!$(this).hasClass('submenu')) {
					$('ul', $(this).parents('ul:first')).slideUp(350);
					$('a', $(this).parents('ul:first')).removeClass('submenu');
					$(this).next('ul').slideDown(350);
					$(this).addClass('submenu');
				} else if($(this).hasClass('submenu')) {
					$(this).removeClass('submenu');
					$(this).next('ul').slideUp(350);
				}
			});
		}

	// Sidebar Initiate
	
	init();
	}

	// Mobile Menu Sidebar Overlay
	
	$('body').append('<div class="sidebar-overlay"></div>');
	$(document).on('click', '#mobile_btn', function() {
		$('main-wrapper').toggleClass('slide-nav');
		$('.sidebar-overlay').toggleClass('opened');
		$('html').addClass('menu-opened');
		return false;
	});	
	
	$(document).on('click', '.sidebar-overlay', function() {
		$('html').removeClass('menu-opened');
		$(this).removeClass('opened');
		$('main-wrapper').removeClass('slide-nav');
	});
	
	$(document).on('click', '#menu_close', function() {
		$('html').removeClass('menu-opened');
		$('.sidebar-overlay').removeClass('opened');
		$('main-wrapper').removeClass('slide-nav');
	});

	// Loader
	
	setTimeout(function () {
		$('#global-loader');
		setTimeout(function () {
			$("#global-loader").fadeOut("slow");
		}, 100);
	}, 500);

	// Page Scroll

	var NavBar = $('nav.navbar');
    var didScroll;
    var lastScrollTop = 0;
    var navbarHeight = NavBar.outerHeight();
    $(function() {
        didScroll = true;
    });
    $(window).on('scroll',function(event) {
        didScroll = true;
    });
    setInterval(function() {
        if (didScroll) {
            hasScrolled();
            didScroll = false;
        }
    }, 100);
	
	// Header Fixed on Scroll

	function hasScrolled() {
        var st = $(document).scrollTop();
        if (st + $(window).height() < $(document).height()) {
        	$(".header-trans").css("background" , "#177c82");
            $(".header-sticky").addClass("fixed-top");
            if (st === 0) {
            	$(".header-trans").css("background" , "transparent");
            	$(".header-sticky").removeClass("fixed-top");
            }
        }
        lastScrollTop = st;
    }
    
    // Featured Venues Slider
    
	if($('.featured-venues-slider').length > 0) {       
		$('.featured-venues-slider').owlCarousel({
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:1
				},
				768:{
					items:2
				},
				1000:{
					items:3
				}
			}
		})
	}

	// Featured Coache Slider
    
	if($('.featured-coache-slider').length > 0) {       
		$('.featured-coache-slider').owlCarousel({
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:1
				},
				768:{
					items:2
				},
				1000:{
					items:4
				}
			}
		})
	}

	// Testimonial Brand Slider
    
	if($('.testimonial-brand-slider').length > 0) {       
		$('.testimonial-brand-slider').owlCarousel({
			loop:true,
			margin:60,
			nav:false,
			dots: false,
			autoplay:true,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:1
				},
				768:{
					items:3
				},
				1000:{
					items:5
				}
			}
		})
	}

	// Fade in Scroll 
	
	if($('.main-wrapper .aos').length > 0) {
		AOS.init({
			duration:1200,
			once:true
		});
	}

	// Logo Hide Btn

	$(document).on("click",".logo-hide-btn",function () {
		$(this).parent().hide();
	});

	// Scroll Header
	
	$(window).on('scroll',function() {
		if ($(this).scrollTop() > 150){
			$('.map-right').addClass('map-top');
		} else {
			$('.map-right').removeClass('map-top');
		}
	});

	 // Datatable 
	
	if ($('.datatable').length > 0) {
		$('.datatable').DataTable({
			retrieve: true,
				lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
			language: {
				search: ' ',
				searchPlaceholder: "Search",
				info:  "Showing _START_ - _END_ of _TOTAL_ entries",
				"lengthMenu": "Show _MENU_",
				paginate: {
				  next: '<i class="feather-chevrons-right"></i>',
				  previous: '<i class="feather-chevrons-left"></i>'  
				}
			},
			"bLengthChange": true,
			"bInfo": false,
			initComplete: (settings, json)=>{
                $('.dataTables_info').appendTo('#tableinfo');
                $('.dt-paging').appendTo('#tablepage');
                $('.dt-length').appendTo('#tablelength');
                $('.dt-search').appendTo('#tablefilter');
            },
		});
	} 

	// Day Selection

	$("#select_days_1").on('change', function() { 
        if( $(this).is(":checked") ){ 
			$('#day-monday').show();
        }
		else {
			$('#day-monday').hide();
		}
    });
	$("#select_days_2").on('change', function() { 
        if( $(this).is(":checked")) { 
			$('#day-tuesday').show();
        }
		else {
			$('#day-tuesday').hide();
		}
    });
	$("#select_days_3").on('change', function() { 
        if( $(this).is(":checked")) { 
			$('#day-wednesday').show();
        }
		else {
			$('#day-wednesday').hide();
		}
    });
	$("#select_days_4").on('change', function() { 
        if( $(this).is(":checked")) { 
			$('#day-thursday').show();
        }
		else {
			$('#day-thursday').hide();
		}
    });
	$("#select_days_5").on('change', function(){ 
        if( $(this).is(":checked")) { 
			$('#day-friday').show();
        }
		else {
			$('#day-friday').hide();
		}
    });
	$("#select_days_6").on('change', function() { 
        if( $(this).is(":checked")) { 
			$('#day-saturday').show();
        }
		else {
			$('#day-saturday').hide();
		}
    });
	$("#select_days_7").on('change', function() { 
        if( $(this).is(":checked")) { 
			$('#day-sunday').show();
        }
		else {
			$('#day-sunday').hide();
		}
    });

	// Datetimepicker Time
	
	if($('.datetimepicker1').length > 0 ) {
		$('.datetimepicker1').datetimepicker({
			format: 'HH:mm A',
			icons: {
				up: "fas fa-angle-up",
				down: "fas fa-angle-down",
				next: 'fas fa-angle-right',
				previous: 'fas fa-angle-left'
			}
		});
	}

	$('.icon-date').on('click', function() {
		$('#date').focus();
	})

	$('.icon-time').on('click', function() {
		$('#timePicker').focus();
	})

	// Select Favourite
	
	$('.fav-icon').on('click', function() {
		$(this).toggleClass('selected');
	});

	// Select Favourite
	
	$('.favour-adds').on('click', function() {
		$(this).toggleClass('selected-color');
	});

	// Select 2

	if ($('.select').length > 0) {
		$('.select').select2({
			minimumResultsForSearch: -1,
			width: '100%'
		});
	}

	// JQuery CounterUp

	if($('.coach-count .counter-up').length > 0) {
		$('.coach-count .counter-up').counterUp({
            delay: 15,
            time: 1500
        });
	}

	// Datetimepicker Date
	
	if($('.timepicker').length > 0 ) {
		$('.timepicker').datetimepicker({
			format: 'HH:mm A',
			icons: {
				up: "fa-solid fa-chevron-up",
				down: "fa-solid fa-chevron-down",
				next: 'fa-solid fa-chevron-right',
				previous: 'fa-solid fa-chevron-left'
			}
		});
	}
	if($('.datetimepicker').length > 0 ) {
		$('.datetimepicker').datetimepicker({
			format: 'DD-MM-YYYY',
			icons: {
				up: "fa-solid fa-chevron-up",
				down: "fa-solid fa-chevron-down",
				next: 'fa-solid fa-chevron-right',
				previous: 'fa-solid fa-chevron-left'
			}
		});
	}

	// Increment Decrement

	$(".inc").on('click', function() {
	    updateValue(this, 1);
	});
	$(".dec").on('click', function() {
	    updateValue(this, -1);
	});
	function updateValue(obj, delta) {
	    var item = $(obj).parent().find("input");
	    var newValue = parseInt(item.val(), 10) + delta;
	    item.val(Math.max(newValue, 0));
	}

	// ToogleClass Active

	$(".coach-types li").on('click', function() {
	    $(this).toggleClass("active").siblings().removeClass('active');
	    if ($(".coach-types ul li.coach-and-lessons").hasClass('active')) {
			$(".coach-types a.change-url").attr("href", "lesson-type.html")

		}
	});

	// AddClass Checked for Booking Date 

	$(".booking-date .time-slot.active").on('click', function() {
	    $(this).toggleClass("checked");
	});

	// Date Slider

	if($('.date-slider').length > 0) {      
		$('.date-slider').owlCarousel({
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:2
				},
				768:{
					items:3
				},
				1000:{
					items:4
				}
			}
		})
	}

	// Lesson Types toggle Class Active

	$(".lesson-types li").on('click', function() {
	    $(this).toggleClass("active").siblings().removeClass('active');
	});

	// Venue Details Options toggle Class Active

	$(".venue-options li").on('click', function() {
	    $(this).toggleClass("active").siblings().removeClass('active');
	});

	// Aside Input Group toggle Class Active

	$("form .input-group input").on('click', function() {
	    $(this).toggleClass("active").siblings().removeClass('active');
	});

	// Main Gallery Owl Carousel Slider for Venue Details

	if($('.main-gallery-slider').length > 0) {   
		$('.main-gallery-slider').owlCarousel({
			loop:true,
			nav:true,
			margin:5,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:2
				},
				768:{
					items:4
				},
				1000:{
					items:5
				}
			}
		})
	}

	// Gallery Owl Carousel Slider For Venue Details

	if($('.gallery-slider').length > 0) {   
		$('.gallery-slider').owlCarousel({
			loop:true,
			margin:10,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:2
				},
				768:{
					items:3
				},
				1000:{
					items:3
				}
			}
		})
	}

	// Show More Text

	$(".show-more").on('click', function() {
        if($(".text").hasClass("show-more-height")) {
            $(this).html('<i class="feather-minus-circle"></i>Show Less');
        } else {
            $(this).html('<i class="feather-plus-circle"></i>Show More');
        }

        $(".text").toggleClass("show-more-height");
	});

    // Range Slider
	
	if($('.input-range').length > 0) {
		$(".input-range").ionRangeSlider({
			type: "single",
			grid: true,
			min: 0,
			max: 100,
			from: 50,
			to: 100       
		});
	}
	
	$('.input-range').on('input', function () {
        $('.demo span').html(this.value);
    });
	
	// Show Filter
	
	$(".filterbtn").on('click', function() {
		  $(".showfilter").toggleClass("filter-open");
	});		

	
	// Common Sidebar Toggle Fun

	if($('.popup-toggle').length > 0) {
		$(".popup-toggle").on('click', function() {
			$(".toggle-sidebar").addClass("open-sidebar");
		});
		$(".sidebar-closes").on('click', function() {
			$(".toggle-sidebar").removeClass("open-sidebar");
		});
	}

	// Stick Sidebar
	
	if ($(window).width() > 767) {
		if($('.theiaStickySidebar').length > 0) {
			$('.theiaStickySidebar').theiaStickySidebar({
			  additionalMarginTop: 30
			});
		}
	}

	// Our Team Slider

	if($('.team-slider').length > 0) {      
		$('.team-slider').owlCarousel({
			items: 4,
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:1
				},
				768:{
					items:2
				},
				1000:{
					items:4
				}
			}
		})
	}

	// Masonry

	if($('.grid').length > 0) {
		$('.grid').masonry({
			temSelector: '.grid-item',
		    columnWidth: '.grid-sizer',
		    gutter: '.gutter-sizer',
			percentPosition: true,
			horizontalOrder: true,
		});
	}

	// Event Sponsors Slider

	if($('.event-sponsors').length > 0) {      
		$('.event-sponsors').owlCarousel({
			items: 6,
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:true,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:2
				},
				768:{
					items:3
				},
				991:{
					items:4
				},
				1000:{
					items:6
				}
			}
		})
	}

	// Testimonials Slider

	if($('.testimonials-slider').length > 0) {      
		$('.testimonials-slider').owlCarousel({
			items: 3,
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:1
				},
				768:{
					items:2
				},
				991:{
					items:2
				},
				1000:{
					items:3
				}
			}
		})
	}

	// Password Eye

	if ($('.toggle-password').length > 0) {
		$(document).on('click', '.toggle-password', function () {
			$(this).toggleClass("feather-eye feather-eye-off");
			var input = $(".pass-input");
			if (input.attr("type") === "password") {
				input.attr("type", "text");
			} else {
				input.attr("type", "password");
			}
		});
	}

	if ($('.toggle-password-confirm').length > 0) {
		$(document).on('click', '.toggle-password-confirm', function () {
			$(this).toggleClass("feather-eye feather-eye-off");
			var input = $(".pass-confirm");
			if (input.attr("type") === "password") {
				input.attr("type", "text");
			} else {
				input.attr("type", "password");
			}
		});
	}

	var chatAppTarget = $('.chat-window');
    (function() {
        if ($(window).width() > 991)
            chatAppTarget.removeClass('chat-slide');
        $(document).on("click", ".chat-window .chat-users-list a.media", function() {
            if ($(window).width() <= 991) {
                chatAppTarget.addClass('chat-slide');
            }
            return false;
        });
        $(document).on("click", "#back_user_list", function() {
            if ($(window).width() <= 991) {
                chatAppTarget.removeClass('chat-slide');
            }
            return false;
        });
    })();
	
	// Blog Slider

	if($('.blog-slider').length > 0) {      
		$('.blog-slider').owlCarousel({
			items: 3,
			loop:true,
			margin:24,
			nav:true,
			dots: false,
			autoplay:false,
			smartSpeed: 2000,
			navText : ["<i class='feather-chevron-left'></i>","<i class='feather-chevron-right'></i>"],
			responsive:{
				0:{
					items:1
				},
				500:{
					items:1
				},
				768:{
					items:2
				},
				991:{
					items:2
				},
				1000:{
					items:3
				}
			}
		})
	}

	$(document).on("click",".booking-days li",function () {
		$(this).toggleClass("active");
	});
	$(document).on("click",".add-wallet-checkbox input",function () {
		$(this).parent().parent().toggleClass("active");
	});

	var check;
	$(document).on("click","aside.payment-modes .form-check",function () {
	    check = $("aside.payment-modes .form-check input").is(":checked");
	    if(check) {
	        $(this).addClass('active').siblings().removeClass('active');
	    } else {
	    	$(this).removeClass('active').siblings().removeClass('active');
	    }
	});

	// Affix Top
	
	$(".venue-options ul li a[href^='#']").on('click', function(e) {
		e.preventDefault();
		var hash = this.hash;
		$('html, body').animate ({
	   		scrollTop: $(hash).offset().top - 85
	 	}, 100, function() {
	 	});
	});

	//Add Rules

	$(document).on('click', '.add-rules', function() {
		var Rules = $(".rules-option").val();
		if( Rules.length > 0 ) {
			$('.error-add-rule').css("display", "none");
			$("ul.rules-wraper").append('<li><i class="feather-check-square"></i>'+ Rules + '</a></li>');
			document.getElementById('add-rules').value='';
      	} else if( !Rules.value) {
        	$('.error-add-rule').css("display", "block");
      	}

	});

})(jQuery);
