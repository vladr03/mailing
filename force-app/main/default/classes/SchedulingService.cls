public with sharing class SchedulingService {
    @AuraEnabled
    public static void runFirstJob() {
        SchedulerCreating.createMailing();
    }
    
    @AuraEnabled
    public static Datetime getCurrentDatetime() {
        return Datetime.now();
    }
    
    @AuraEnabled
    public static AsyncApexJob checkFirstJobStatus(Datetime submittedDatetime, String methodName) {
        List<AsyncApexJob> asyncApexJobs = [SELECT Id, Status, ExtendedStatus FROM AsyncApexJob 
                                            WHERE MethodName = :methodName AND CompletedDate >= :submittedDatetime WITH SECURITY_ENFORCED LIMIT 1];
        AsyncApexJob asyncApexJob = (asyncApexJobs.size() == 1) ? asyncApexJobs.get(0) : null;
        if (asyncApexJob != null) {
            return asyncApexJob;
        }
        return null;
    }
    
    @AuraEnabled
    public static String getCurrentlyScheduleCron(String cronJobName) {
        List<CronTrigger> cronTriggers = [SELECT Id, CronExpression FROM CronTrigger 
                                          WHERE CronJobDetail.Name = :cronJobName WITH SECURITY_ENFORCED LIMIT 1];
        CronTrigger cronTrigger = (cronTriggers.size() == 1) ? cronTriggers.get(0) : null;
        if (cronTrigger != null) {
            return cronTrigger.CronExpression;
        } 
        return null;
    }
    
    @AuraEnabled
    public static Boolean scheduleJob(String cronString, String cronJobName) {
        try {
        MailingSchedule scheduler = new MailingSchedule();
        System.schedule(cronJobName, cronString, scheduler);
        return true;
        } catch (Exception e) {
        System.debug(e.getMessage());
        return false;
        }
    }

    @AuraEnabled
  public static Boolean deleteScheduledJob(String cronJobName) {
    try {
      List<CronTrigger> cronTriggers = [SELECT Id, CronExpression FROM CronTrigger
                                        WHERE CronJobDetail.Name = :cronJobName WITH SECURITY_ENFORCED LIMIT 1];
      CronTrigger cronTrigger = (cronTriggers.size() == 1) ? cronTriggers.get(0) : null;
      System.abortJob(cronTrigger.Id);
      return true;
    } catch (Exception e) {
      System.debug(e.getMessage());
      return false;
    }
  }
}