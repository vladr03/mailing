public with sharing class SchedulingService {
  @AuraEnabled
  public static void runFirstJob(String myBatchClass) {
      Type t = Type.forName(myBatchClass);
      Database.Batchable<sObject> b = (Database.Batchable<sObject>) t.newInstance();
      Database.executeBatch(b);
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
  public static Boolean scheduleJob(String cronString, String cronJobName, String apexClass) {
      try {
          Type t = Type.forName(apexClass);
          Schedulable s = (Schedulable) t.newInstance();
          System.debug('debug ' + s);
          //MailingSchedule ms = new MailingSchedule();
          System.schedule(cronJobName, cronString, s);
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
  
  @AuraEnabled
  public static String checkClass(String className) {
      //ApexClass apexClass = [SELECT Name FROM ApexClass WHERE Name = :className];
      //return apexClass;
      String str = [SELECT Name FROM ApexClass WHERE Name = :className].Name;
      return str;
  }
}