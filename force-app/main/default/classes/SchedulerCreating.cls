public with sharing class SchedulerCreating {
    public String myBatchClass;

    public static void createMailing() {
        Mailing m = new Mailing();
        Database.executeBatch(m);
        System.debug('class is started');
    }
}