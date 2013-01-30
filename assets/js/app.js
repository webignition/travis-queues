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
            
            if (!isQueueNameIgnored(jobQueueName)) {
                queues[jobQueueName].push(job);                
            }
        }       


        callback();
    }
    
    var presentQueues = function (queues, callback) {
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
        
        var columnCount = 3;
        var queueGroups = [];
        var queueIndex = 0;
        
        var currentQueueGroup = [];

        for (var queueName in queues) {
            if (queues.hasOwnProperty(queueName)) {                
                currentQueueGroup.push(queueName);
                
                if (queueIndex % columnCount === (columnCount - 1)) {
                    queueGroups.push(currentQueueGroup);
                    currentQueueGroup = [];
                }                
                
                queueIndex++;
            }
        }                
        
        queueGroups.push(currentQueueGroup);
        
        for (var queueGroupIndex = 0; queueGroupIndex < queueGroups.length; queueGroupIndex++) {
            var row = $('<div class="row-fluid queue-group" />');
            
            for (queueIndex = 0; queueIndex < queueGroups[queueGroupIndex].length; queueIndex++) {
                var queueName = queueGroups[queueGroupIndex][queueIndex];
                var queueLength = queues[queueName].length;
                var queueContent = $('<div class="span4 well queue" />');                
                queueContent.append($('<h2>'+getQueueLabel(queueName)+' ('+(queueLength)+')</h2>'));
                
                var jobListMaxiumumLimit = 10;
                var jobListLimit = Math.min(queueLength, jobListMaxiumumLimit);
                
                var jobList = $('<ul class="job-list" />');
                
                for (var jobIndex = 0; jobIndex < jobListLimit; jobIndex++) {                    
                    var job_id = queues[queueName][jobIndex].id;
                    
                    jobList.append($('<li id="job-'+(job_id)+'" class="job"></li>'));
                    presentRepoInJobList(queues[queueName][jobIndex], queues[queueName][jobIndex].repository_id);
                }
                
                queueContent.append(jobList);                
                row.append(queueContent);
            }
            
            
            $('#queues').append(row);
        }
        
        callback();
    };
    
    var presentRepoInJobList = function (job, repository_id) {
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
                var content = $('<span class="content"><a class="github-link" href="https://github.com/'+data.slug+'">'+data.slug+'</a> <a class="travis-ci-link" href="https://travis-ci.org/'+data.slug+'/jobs/'+job.id+'">#'+job.number+'</a></span>');
                
                $('#job-'+job.id).html(content);
            },
            url:'https://api.travis-ci.org/repos/' + repository_id
        });        
    };
    
    var updateQueues = function () {
        console.log('update ...');
    };
    
    getJobs(function () {
        buildQueues(jobCollection, function () {
            presentQueues(queues, function () {
//                window.setInterval(function () {
//                    updateQueues();
//                }, 3000);
            });
        });
    });   
});