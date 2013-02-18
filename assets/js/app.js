$(document).ready(function() {
    var queueNamesToIgnore = ['node_js'];    
    
    var isQueueNameIgnored = function (queueName) {
        for (var index = 0; index < queueNamesToIgnore.length; index++) {
            if (queueNamesToIgnore[index] == queueName) {
                return true;
            }
        }
        
        return false;
    };
    
    var queueLabels = {
        'common':'Common',
        'php':'PHP, Perl and Python',
        'jvmotp':'JVM, Erlang and Node.js',
        'rails':'Rails',        
        'spree':'Spree'
    };
    
    var getQueueLabel = function (queueName) {
        if (queueLabels[queueName] == undefined) {
            return queueName;
        }
        
        return queueLabels[queueName];
    };
    
    var jobCollection = [];
    var queues = [];    
    
    var getJobs = function (callback) {
        jQuery.ajax({
            complete:function (request, textStatus) {
                //console.log('complete', request, textStatus);
            },
            dataType:'json',
            error:function (request, textStatus, errorThrown) {
                //console.log('error', request, textStatus, request.getAllResponseHeaders());
            },
            statusCode: {
                403: function () {
                    console.log('403');
                },
                500: function () {
                    console.log('500');
                }
            },
            success: function (data, textStatus, request) {                
                jobCollection = data;
                callback();
            },
            url:'https://api.travis-ci.org/jobs/'
        });         
    };
    
    var buildQueues = function (jobCollection, callback) {
        var jobCollectionLength = jobCollection.length;
        
        for (var queueName in queueLabels) {
            if (queueLabels.hasOwnProperty(queueName)) {
                queues[queueName] = [];
            }
        }        
        
        for (var jobCollectionIndex = 0; jobCollectionIndex < jobCollectionLength; jobCollectionIndex++) {
            var job = jobCollection[jobCollectionIndex];            
            var jobQueueName = job.queue.replace('builds.', '');
            
            if (queues[jobQueueName] === undefined) {
                queues[jobQueueName] = [];
            }            
            
            if (!isQueueNameIgnored(jobQueueName) && !(queues[jobQueueName] === undefined)) {
                queues[jobQueueName].push(job);                
            }
        }       


        callback();
    }
    
    var renderQueues = function (queues, callback) {                
        var addQueueGroup = function (queueGroup) {
            if (queueGroup.length > 0) {
                var queueGroupName = queueGroup.join('-');
                queueGroups[queueGroupName] = queueGroup;
            }            
        };
        
        var columnCount = 3;
        var queueGroups = {};
        var queueIndex = 0;
        
        var currentQueueGroup = [];

        for (var queueName in queues) {
            if (queues.hasOwnProperty(queueName)) {                
                currentQueueGroup.push(queueName);
                
                if (queueIndex % columnCount === (columnCount - 1)) {
                    addQueueGroup(currentQueueGroup);
                    currentQueueGroup = [];
                }                
                
                queueIndex++;
            }
        }
        
        addQueueGroup(currentQueueGroup);

        for (var queueGroupName in queueGroups) {
            if (queueGroups.hasOwnProperty(queueGroupName)) {
                var queueGroupId = 'queue-group-'+queueGroupName;
                var queueGroupElement = $('#'+queueGroupId);
                
                if (queueGroupElement.length === 0) {
                    $('#queues').append('<div class="row-fluid queue-group" id="'+queueGroupId+'" />');
                }
                
                queueGroupElement = $('#'+queueGroupId);

                for (queueIndex = 0; queueIndex < queueGroups[queueGroupName].length; queueIndex++) {
                    var queueName = queueGroups[queueGroupName][queueIndex];
                    var queueLength = queues[queueName].length;
                    var queueId = 'queue-'+queueName;
                    
                    var queueElement = $('#'+queueId);
                    if (queueElement.length === 0) {
                        queueGroupElement.append('<div class="span4 well queue" id="'+queueId+'" />');
                    }
                    
                    queueElement = $('#'+queueId);
                    
                    if ($('h2', queueElement).length === 0) {
                        queueElement.append('<h2>'+getQueueLabel(queueName)+' (<span id="'+queueId+'-length">'+(queueLength)+'</span>)</h2>');
                    } else {
                        var queueLengthElement = $('#'+queueId+'-length');                        
                        var currentQueueLength = queueLengthElement.text();
                        
                        if (currentQueueLength != queueLength) {                           
                            queueLengthElement.text(queueLength);
                        }
                    }

                    var jobListMaxiumumLimit = 10;
                    var jobListLimit = Math.min(queueLength, jobListMaxiumumLimit);
                    
                    var jobListId = 'job-list-'+queueName;
                    var jobListElement = $('#'+jobListId);
                
                    if (jobListElement.length === 0) {
                        queueElement.append('<ul class="job-list" id="'+jobListId+'" />');
                    }
                    
                    jobListElement = $('#'+jobListId);
                    
                    var queueContainsJobById = function (jobId) {                        
                        for (var jobIndex = 0; jobIndex < queueLength; jobIndex++) {                    
                            if (queues[queueName][jobIndex].id == jobId) {
                                return true;
                            }
                        }  
                        
                        return false;
                    }
                    
                    $('.job', jobListElement).each(function () {                      
                        var jobElement = $(this);
                        var jobId = jobElement.attr('id').replace('job-', '');
                        
                        if (!queueContainsJobById(jobId)) {                            
                            jobElement.animate({
                                'opacity':0
                            }, function () {
                                jobElement.remove();
                            });                            
                        }
                    });
                    
                    for (var jobIndex = 0; jobIndex < jobListLimit; jobIndex++) {                    
                        var jobId = 'job-'+queues[queueName][jobIndex].id;
                        
                        var jobElement = $('#'+jobId);
                        if (jobElement.length === 0) {
                            if ($('.job', jobListElement).length < jobListMaxiumumLimit) {
                                jobElement = $('<li id="'+jobId+'" class="job">'+jobId+'</li>');
                                jobElement.css({
                                    'opacity':0
                                });                                
;
                                jobListElement.append(jobElement);
                                jobElement.animate({
                                    'opacity':1
                                });
                            }
                            
                            presentRepoInJobList(queues[queueName][jobIndex]);
                        }                        
                    }
                }                
            }
        }
        
        callback();
    };
    
    var presentRepoInJobList = function (job) {
        jQuery.ajax({
            complete:function (request, textStatus) {
                //console.log('complete', request, textStatus);
            },
            dataType:'json',
            error:function (request, textStatus, errorThrown) {
                //console.log('error', request, textStatus, request.getAllResponseHeaders());
            },
            statusCode: {
                403: function () {
                    console.log('403');
                },
                500: function () {
                    console.log('500');
                }
            },
            success: function (data, textStatus, request) {
                var repo = (data.hasOwnProperty('repo')) ? data.repo : data;
                
                var content = $('<span class="content"><a class="github-link" href="https://github.com/'+repo.slug+'">'+repo.slug+'</a> <a class="travis-ci-link" href="https://travis-ci.org/'+repo.slug+'/jobs/'+job.id+'">#'+job.number+'</a></span>');
                
                $('#job-'+job.id).html(content);
            },
            url:'https://api.travis-ci.org/repos/' + job.repository_id
        });        
    };
    
    var updateQueues = function () {
        getJobs(function () {
            buildQueues(jobCollection, function () {
                renderQueues(queues, function () {                    
                    window.setTimeout(function () {
                        updateQueues();
                    }, 1000);                    
                });
            });            
        });
    };
    
    getJobs(function () {
        buildQueues(jobCollection, function () {
            $('#placeholder').animate({
                'opacity':0
            }, function () {
                $('#placeholder').slideUp(function () {
                    $('#queues').animate({
                        'opacity':1
                    }, function () {
                        $('body').css({
                            'height':'auto'
                        });
                    });
                });
            });            
            
            renderQueues(queues, function () {
                window.setTimeout(function () {
                    updateQueues();
                }, 1000);
            });
        });
    });   
});