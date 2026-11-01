export const locales = ["it", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export type Dictionary = {
  appName: string;
  sidebar: {
    title: string;
    signedInAs: string;
    logout: string;
    localeLabel: string;
    themeLabel: string;
    themeToLight: string;
    themeToDark: string;
    settingsSection: string;
    menu: string;
    primaryNav: string;
    skipToContent: string;
    unreadNotifications: string;
    nav: {
      dashboard: string;
      courses: string;
      lessons: string;
      bookings: string;
      users: string;
      reports: string;
      myNotifications: string;
      profileSettings: string;
      manualNotifications: string;
      registries: string;
      siteSettings: string;
      dangerZone: string;
    };
  };
  profileSettings: {
    title: string;
    subtitle: string;
    tabs: {
      security: string;
      notifications: string;
      telegram: string;
    };
    telegramTitle: string;
    telegramDescription: string;
    linkedStatus: string;
    notLinkedStatus: string;
    linkedChatIdLabel: string;
    linkedUsernameLabel: string;
    generateCodeCta: string;
    codeLabel: string;
    codeHint: string;
    openTelegramCta: string;
    qrHint: string;
    noBotConfiguredHint: string;
    commandLabel: string;
    expiresHint: string;
    generating: string;
    accountSecurityTitle: string;
    accountSecurityDescription: string;
    currentEmailLabel: string;
    emailVerifiedStatus: string;
    emailNotVerifiedStatus: string;
    pendingEmailLabel: string;
    newEmailLabel: string;
    newEmailPlaceholder: string;
    sendEmailChangeCta: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    updatePasswordCta: string;
    twoFactorTitle: string;
    twoFactorDescription: string;
    twoFactorEnabled: string;
    twoFactorDisabled: string;
    twoFactorSetupCta: string;
    twoFactorDisableCta: string;
    twoFactorVerifyCta: string;
    twoFactorCodeLabel: string;
    twoFactorSecretLabel: string;
    twoFactorOtpAuthLabel: string;
    twoFactorHint: string;
    cancelCta: string;
    webPushTitle: string;
    webPushDescription: string;
    webPushSupported: string;
    webPushNotSupported: string;
    webPushMissingKey: string;
    webPushEnabled: string;
    webPushDisabled: string;
    webPushEnableCta: string;
    webPushDisableCta: string;
    webPushProcessing: string;
    webPushTestCta: string;
    notificationPrefsTitle: string;
    notificationPrefsDescription: string;
    notificationEmailLabel: string;
    notificationTelegramLabel: string;
    notificationWebPushLabel: string;
    notificationLocalAlwaysOnLabel: string;
    notificationPrefsSaveCta: string;
    notificationsRetentionDaysLabel: string;
    notificationsRetentionDaysHint: string;
  };
  pwaInstall: {
    title: string;
    description: string;
    installCta: string;
    dismissCta: string;
  };
  webPushPrompt: {
    title: string;
    description: string;
    enableCta: string;
    dismissCta: string;
    unsupported: string;
    enabled: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    tabLogin: string;
    tabRegister: string;
    noAccount: string;
    hasAccount: string;
    loginCta: string;
    registerCta: string;
    nameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    passwordHint: string;
    loginMethodPassword: string;
    loginMethodOtp: string;
    loginMethodMagicLink: string;
    loginMethodLabel: string;
    loginMethodOtpHint: string;
    loginMethodMagicHint: string;
    sendCodeCta: string;
    verifyCodeCta: string;
    sendMagicLinkCta: string;
    twoFactorTitle: string;
    twoFactorHint: string;
    forgotPasswordCta: string;
    resendVerificationCta: string;
    resendVerificationLabel: string;
    resendVerificationSubmitCta: string;
    firstUserHint: string;
    invalidCredentials: string;
  };
  bookings: {
    title: string;
    description: string;
    calendarTitle: string;
    monthNavigationLabel: string;
    empty: string;
    seatsLabel: string;
    bookedLabel: string;
    youAreBooked: string;
    awaitingConfirmation: string;
    accessDenied: string;
    courseTag: string;
    detailsCta: string;
    detailsTitle: string;
    detailsDescription: string;
    startsAtLabel: string;
    endsAtLabel: string;
    trainerLabel: string;
    closeCta: string;
    prevMonth: string;
    nextMonth: string;
    bookCta: string;
    unbookCta: string;
    confirmUnbookTitle: string;
    confirmUnbookDescription: string;
    confirmUnbookCta: string;
    confirmKeepBookingCta: string;
    processing: string;
    youAreQueued: string;
    queuedLabel: string;
    joinQueueCta: string;
    prevWeek: string;
    nextWeek: string;
    weekNavigationLabel: string;
    today: string;
    noLessonsDay: string;
    closedDay: string;
    viewLabel: string;
    viewDay: string;
    viewWeek: string;
    viewMonth: string;
    noLessonsWeek: string;
    noLessonsShort: string;
    closedShort: string;
    lessonsCount: string;
    lessonsCountOne: string;
    monthGridLabel: string;
    pendingToConfirm: string;
    seatsFree: string;
    seatFreeOne: string;
    full: string;
    queueCount: string;
    stampBooked: string;
    stampPending: string;
    stampQueued: string;
    cancelBy: string;
    cancelClosed: string;
    costFixed: string;
    costPeriod: string;
    requiresConfirmation: string;
    lessonEnded: string;
    lessonInProgress: string;
    manageCta: string;
    showDetails: string;
    upcomingTitle: string;
    upcomingEmpty: string;
    dayLessons: string;
    pass: {
      fixedTitle: string;
      weeklyTitle: string;
      monthlyTitle: string;
      remaining: string;
      availableWeek: string;
      availableMonth: string;
      availableWeekOf: string;
      availableMonthOf: string;
      validUntil: string;
      trialTitle: string;
      trialUntil: string;
      inactiveTitle: string;
      inactiveBody: string;
      openPlanTitle: string;
      openPlanBody: string;
      activeBookings: string;
      activeBookingsOne: string;
      slotsLabel: string;
    };
  };
  lessonsPage: {
    todayTag: string;
    emptyMonthTitle: string;
    emptyMonthFiltered: string;
    backToCurrentMonth: string;
    showAllLessonsCta: string;
    onlyMineCta: string;
    filtersLabel: string;
    cancelledTag: string;
    standaloneTag: string;
    lessonsCount: string;
    lessonsCountOne: string;
    monthLessonsSummary: string;
    manageCta: string;
    moreActionsLabel: string;
    emptyMonth: string;
    title: string;
    description: string;
    prevMonth: string;
    nextMonth: string;
    monthNavigationLabel: string;
    emptyDay: string;
    trainerLabel: string;
    bookedLabel: string;
    courseTag: string;
    updateTrainerCta: string;
    modifiedTag: string;
    modifiedReasonsLabel: string;
    modifiedReasonTrainer: string;
    modifiedReasonTime: string;
    standaloneTitle: string;
    standaloneDescription: string;
    standaloneDuration: string;
    standaloneMaxAttendees: string;
    standaloneCancellationWindow: string;
    standaloneLessonType: string;
    lessonTitleLabel: string;
    lessonDescriptionLabel: string;
    startsAtLabel: string;
    createStandaloneCta: string;
    updateStandaloneCta: string;
    deleteStandaloneCta: string;
    deleteLessonCta: string;
    confirmDeleteLessonTitle: string;
    confirmDeleteLessonDescription: string;
    restoreLessonCta: string;
    showDeletedCta: string;
    hideDeletedCta: string;
    showPastCta: string;
    hidePastCta: string;
    deletedTag: string;
    detailsTitle: string;
    detailsDescription: string;
    detailsTriggerLabel: string;
    manageTitle: string;
    manageDescription: string;
    manageTriggerLabel: string;
    manageTabMain: string;
    manageTabPeople: string;
    processing: string;
    closeCta: string;
    attendeesLabel: string;
    noAttendees: string;
    attendeeSelectLabel: string;
    addAttendeeCta: string;
    removeAttendeeCta: string;
    markAttendancePresentCta: string;
    markAttendanceNoShowCta: string;
    attendanceStatusLabel: string;
    attendanceStatusPresent: string;
    attendanceStatusNoShow: string;
    attendanceStatusUnmarked: string;
    pendingApprovalsLabel: string;
    noPendingApprovals: string;
    confirmPendingCta: string;
    confirmPendingAndGrantAccessCta: string;
    rejectPendingCta: string;
    waitlistLabel: string;
    noWaitlist: string;
    confirmWaitlistCta: string;
    removeWaitlistCta: string;
    notifySectionTitle: string;
    notifyMessageLabel: string;
    notifyMessagePlaceholder: string;
    notifySendCta: string;
  };
  usersPage: {
    title: string;
    description: string;
    createCta: string;
    createTitle: string;
    editTitle: string;
    createDescription: string;
    editDescription: string;
    tableTitle: string;
    empty: string;
    searchPlaceholder: string;
    filters: {
      allRoles: string;
    };
    columns: {
      name: string;
      email: string;
      role: string;
      membership: string;
      subscription: string;
      actions: string;
    };
    fields: {
      name: string;
      email: string;
      password: string;
      emailVerified: string;
      role: string;
      membershipStatus: string;
      trialEndsAt: string;
      subscriptionType: string;
      subscriptionLessons: string;
      subscriptionRemaining: string;
      subscriptionResetAt: string;
      subscriptionEndsAt: string;
      lessonTypeAccess: string;
    };
    tabs: {
      profile: string;
      membership: string;
      subscription: string;
      access: string;
    };
    actions: {
      save: string;
      reviewCreate: string;
      reviewUpdate: string;
      cancel: string;
      edit: string;
      message: string;
      sendMessage: string;
      delete: string;
      confirm: string;
      processing: string;
    };
    messageDialogTitle: string;
    messageDialogDescription: string;
    messagePlaceholder: string;
    confirmCreateTitle: string;
    confirmCreateDescription: string;
    confirmUpdateTitle: string;
    confirmUpdateDescription: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    roleOptions: {
      ADMIN: string;
      TRAINER: string;
      TRAINEE: string;
    };
    membershipOptions: {
      ACTIVE: string;
      INACTIVE: string;
    };
    subscriptionOptions: {
      NONE: string;
      WEEKLY: string;
      MONTHLY: string;
      FIXED: string;
    };
    lessonTypeAccessOptions: {
      DENIED: string;
      REQUIRES_CONFIRMATION: string;
      ALLOWED: string;
    };
    passwordCreateHint: string;
    passwordKeepHint: string;
  };
  courses: {
    title: string;
    subtitle: string;
    createCta: string;
    createTitle: string;
    createDescription: string;
    updateTitle: string;
    updateDescription: string;
    reviewCreate: string;
    reviewUpdate: string;
    tabs: {
      main: string;
    };
    catalogTitle: string;
    empty: string;
    searchPlaceholder: string;
    filterAll: string;
    filterWithTrainer: string;
    filterWithoutTrainer: string;
    showDeletedCta: string;
    hideDeletedCta: string;
    deletedTag: string;
    columns: {
      name: string;
      lessonType: string;
      duration: string;
      maxAttendees: string;
      trainer: string;
      schedule: string;
      actions: string;
    };
    actions: {
      edit: string;
      delete: string;
      restore: string;
      cancel: string;
      confirm: string;
      processing: string;
    };
    fields: {
      name: string;
      description: string;
      lessonType: string;
      trainer: string;
      durationMinutes: string;
      maxAttendees: string;
      bookingAdvanceMonths: string;
      cancellationWindowHours: string;
    };
    confirm: {
      createTitle: string;
      createDescription: string;
      updateTitle: string;
      updateDescription: string;
      deleteTitle: string;
      deleteDescription: string;
      deletePolicyTitle: string;
      deletePolicyDescription: string;
      deletePolicyKeepCta: string;
      deletePolicyCancelCta: string;
    };
    validation: {
      nameRequired: string;
      lessonTypeRequired: string;
      trainerRequired: string;
      descriptionRequired: string;
      numericInvalid: string;
      numericPositive: string;
      scheduleRequired: string;
      scheduleInvalid: string;
      scheduleOverlap: string;
      scheduleClosedWeekday: string;
    };
    schedule: {
      title: string;
      description: string;
      addSlot: string;
      noSlots: string;
      removeSlot: string;
      weekdays: {
        MONDAY: string;
        TUESDAY: string;
        WEDNESDAY: string;
        THURSDAY: string;
        FRIDAY: string;
        SATURDAY: string;
        SUNDAY: string;
      };
    };
  };
  appPages: {
    dashboard: {
      title: string;
      description: string;
      stats: {
        activeCourses: string;
        todayLessons: string;
        bookings: string;
        pendingApprovals: string;
      };
      pending: {
        openCta: string;
        dialogTitle: string;
        dialogDescription: string;
        empty: string;
        approveCta: string;
        approveAndUnlockCta: string;
        rejectCta: string;
        closeCta: string;
      };
      crowding: {
        title: string;
        description: string;
        contextLabel: string;
        contextLabelOne: string;
        previousDay: string;
        nextDay: string;
        empty: string;
        avgAttendees: string;
      };
      home: {
        greetingMorning: string;
        greetingAfternoon: string;
        greetingEvening: string;
        summaryToday: string;
        summaryTodayOne: string;
        summaryNone: string;
        todayTitle: string;
        todayEmpty: string;
        inProgress: string;
        ended: string;
        queueShort: string;
        pendingShort: string;
        occupancyLabel: string;
        attendeesCta: string;
        manageCta: string;
        todoTitle: string;
        todoEmpty: string;
        todoPendingTitle: string;
        todoAttendanceTitle: string;
        todoAttendanceBody: string;
        todoRiskTitle: string;
        todoRiskBody: string;
        todoRiskCta: string;
        todoAttendanceCta: string;
        nextLessonTitle: string;
        laterTitle: string;
        memberEmpty: string;
        bookCta: string;
        seeAllCta: string;
      };
      userInsights: {
        chartFutureSuffix: string;
        chartFutureNote: string;
        upcomingTitle: string;
        upcomingDescription: string;
        upcomingEmpty: string;
        roleTrainer: string;
        roleTrainee: string;
        bookingPending: string;
        rankingTitle: string;
        rankingDescription: string;
        includeFuture: string;
        rankingEmpty: string;
        lessonsCountSuffix: string;
        totalTimeTitle: string;
        totalTimeDescription: string;
        totalTimeEmpty: string;
        totalTimeHours: string;
        chartTitle: string;
        chartDescription: string;
        chartRangeLabel: string;
        chartRangeWeek: string;
        chartRangeMonth: string;
        chartRangeYear: string;
        chartEmpty: string;
      };
    };
    lessons: {
      title: string;
      description: string;
    };
    bookings: {
      title: string;
      description: string;
    };
    users: {
      title: string;
      description: string;
    };
    reports: {
      title: string;
      description: string;
      empty: string;
      trendLabel: string;
      trendShort: string;
      trendNoPrevious: string;
      pointsUnit: string;
      executiveTitle: string;
      executiveTopCourse: string;
      executiveBusiestSlot: string;
      executiveTopNoShow: string;
      exportPdfCta: string;
      filters: {
        periodLabel: string;
        last7Days: string;
        last30Days: string;
        last90Days: string;
        applyCta: string;
      };
      kpis: {
        lessonsCount: string;
        totalBookings: string;
        avgFillRate: string;
      };
      sections: {
        coursePopularityTitle: string;
        timeCrowdingTitle: string;
        trainerPerformanceTitle: string;
        noShowAnalyticsTitle: string;
        courseHealthChartTitle: string;
        courseHealthChartDescription: string;
      };
      columns: {
        course: string;
        trainer: string;
        trainee: string;
        weekday: string;
        time: string;
        lessons: string;
        bookings: string;
        markedAttendances: string;
        present: string;
        noShow: string;
        noShowRate: string;
        avgAttendees: string;
        fillRate: string;
        uniqueTrainees: string;
      };
      weekdays: {
        MONDAY: string;
        TUESDAY: string;
        WEDNESDAY: string;
        THURSDAY: string;
        FRIDAY: string;
        SATURDAY: string;
        SUNDAY: string;
      };
      settings: {
        title: string;
        description: string;
        frequencyLabel: string;
        frequencyNever: string;
        frequencyWeekly: string;
        frequencyMonthly: string;
        reportsLabel: string;
        lastSentLabel: string;
        saveCta: string;
        savedMessage: string;
      };
    };
    myNotifications: {
      unreadOne: string;
      unreadMany: string;
      prevPage: string;
      nextPage: string;
      title: string;
      description: string;
      empty: string;
      deleteOneCta: string;
      deleteAllCta: string;
      confirmDeleteAllTitle: string;
      confirmDeleteAllDescription: string;
      confirmDeleteAllConfirmCta: string;
      confirmDeleteAllCancelCta: string;
      pageLabel: string;
      unreadBadge: string;
      closeCta: string;
    };
  };
  registries: {
    title: string;
    subtitle: string;
    tabs: {
      lessonTypes: string;
    };
    lessonTypes: {
      title: string;
      description: string;
      nameLabel: string;
      descriptionLabel: string;
      iconSvgLabel: string;
      colorLabel: string;
      createCta: string;
      editCta: string;
      updateTitle: string;
      updateCta: string;
      deleteCta: string;
      deleteConfirmTitle: string;
      deleteConfirmDescription: string;
      cancelCta: string;
      processing: string;
      empty: string;
    };
  };
  siteSettings: {
    title: string;
    subtitle: string;
    tabs: {
      general: string;
      contacts: string;
      notifications: string;
      schedule: string;
    };
    fields: {
      siteName: string;
      siteLogoSvg: string;
      weeklyResetWeekday: string;
      contactAddress: string;
      contactEmail: string;
      contactPhone: string;
      smtpHost: string;
      smtpPort: string;
      smtpAuthEnabled: string;
      smtpUser: string;
      smtpFromEmail: string;
      smtpPasswordConfigured: string;
      telegramBotUsername: string;
      telegramBotTokenConfigured: string;
      smtpSectionTitle: string;
      telegramSectionTitle: string;
      openWeekdays: string;
      closedDates: string;
    };
    weekdays: {
      MONDAY: string;
      TUESDAY: string;
      WEDNESDAY: string;
      THURSDAY: string;
      FRIDAY: string;
      SATURDAY: string;
      SUNDAY: string;
    };
    actions: {
      save: string;
      saving: string;
      testEmail: string;
      testingEmail: string;
      testTelegram: string;
      testingTelegram: string;
    };
    readonlyHint: string;
    configuredValue: string;
    missingValue: string;
    logoPreview: string;
    logoPathInvalid: string;
    closedDatesInvalid: string;
  };
  dangerZone: {
    title: string;
    subtitle: string;
    backupTitle: string;
    backupDescription: string;
    uploadTitle: string;
    uploadDescription: string;
    uploadFileLabel: string;
    uploadCta: string;
    uploading: string;
    backupEmpty: string;
    backupCreateCta: string;
    backupCreating: string;
    restoreTitle: string;
    restoreDescription: string;
    restoreBackupLabel: string;
    restoreBackupPlaceholder: string;
    restoreOtpLabel: string;
    restoreWarningConfirm: string;
    restoreBackupPromptConfirm: string;
    restoreCta: string;
    restoring: string;
    resetTitle: string;
    resetDescription: string;
    resetConfirmationLabel: string;
    resetConfirmationHint: string;
    resetOtpLabel: string;
    resetWarningConfirm: string;
    resetBackupPromptConfirm: string;
    resetCta: string;
    resetting: string;
    backupDateLabel: string;
    backupSizeLabel: string;
  };
  manualNotifications: {
    title: string;
    subtitle: string;
    fields: {
      audience: string;
      subject: string;
      body: string;
    };
    audienceOptions: {
      ALL: string;
      TRAINERS: string;
      TRAINEES: string;
    };
    actions: {
      send: string;
      sending: string;
      retry: string;
      retrySelected: string;
      retrying: string;
    };
    outbox: {
      title: string;
      empty: string;
      filters: {
        status: string;
        channel: string;
        from: string;
        to: string;
        apply: string;
        reset: string;
      };
      channelOptions: {
        ALL: string;
        EMAIL: string;
        TELEGRAM: string;
        WEBPUSH: string;
      };
      statusOptions: {
        ALL: string;
        PENDING: string;
        PROCESSING: string;
        SENT: string;
        FAILED: string;
      };
      pagination: {
        prev: string;
        next: string;
        pageInfo: string;
      };
      columns: {
        channel: string;
        recipient: string;
        subject: string;
        attempts: string;
        error: string;
        createdAt: string;
        actions: string;
      };
    };
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  it: {
    appName: "NekoGym",
    sidebar: {
      title: "Pannello",
      signedInAs: "Connesso come",
      logout: "Esci",
      localeLabel: "Lingua",
      themeLabel: "Tema",
      themeToLight: "Passa al tema chiaro",
      themeToDark: "Passa al tema scuro",
      settingsSection: "Impostazioni",
      menu: "Menu",
      primaryNav: "Navigazione principale",
      skipToContent: "Vai al contenuto",
      unreadNotifications: "notifiche non lette",
      nav: {
        dashboard: "Home",
        courses: "Corsi",
        lessons: "Lezioni",
        bookings: "Prenotazioni",
        users: "Utenti",
        reports: "Report",
        myNotifications: "Notifiche",
        profileSettings: "Profilo",
        manualNotifications: "Invio notifiche",
        registries: "Registri",
        siteSettings: "Impostazioni sito",
        dangerZone: "Danger zone",
      },
    },
    profileSettings: {
      title: "Impostazioni profilo",
      subtitle: "Gestisci collegamento Telegram e impostazioni personali.",
      tabs: {
        security: "Sicurezza",
        notifications: "Notifiche",
        telegram: "Telegram",
      },
      telegramTitle: "Telegram",
      telegramDescription: "Collega il tuo account Telegram per ricevere notifiche e usare i comandi bot.",
      linkedStatus: "Telegram collegato",
      notLinkedStatus: "Telegram non collegato",
      linkedChatIdLabel: "Chat ID",
      linkedUsernameLabel: "Username",
      generateCodeCta: "Inizia verifica Telegram",
      codeLabel: "Codice link",
      codeHint: "Usa questo codice con il comando /link nel bot.",
      openTelegramCta: "Apri Telegram con comando pronto",
      qrHint: "Scansiona per aprire Telegram e inviare il comando automaticamente.",
      noBotConfiguredHint: "Configura TELEGRAM_BOT_USERNAME per abilitare deep link e QR.",
      commandLabel: "Comando",
      expiresHint: "Il codice scade dopo 30 minuti.",
      generating: "Generazione...",
      accountSecurityTitle: "Sicurezza account",
      accountSecurityDescription: "Gestisci verifica email, cambio email, password e web push.",
      currentEmailLabel: "Email attuale",
      emailVerifiedStatus: "Email verificata",
      emailNotVerifiedStatus: "Email non verificata",
      pendingEmailLabel: "Nuova email in attesa di conferma",
      newEmailLabel: "Nuova email",
      newEmailPlaceholder: "nuova@email.com",
      sendEmailChangeCta: "Invia conferma",
      currentPasswordLabel: "Password corrente",
      newPasswordLabel: "Nuova password",
      updatePasswordCta: "Aggiorna password",
      twoFactorTitle: "Autenticazione a due fattori (2FA)",
      twoFactorDescription: "Proteggi l'accesso con password richiedendo un codice dell'app authenticator.",
      twoFactorEnabled: "2FA attiva",
      twoFactorDisabled: "2FA non attiva",
      twoFactorSetupCta: "Configura 2FA",
      twoFactorDisableCta: "Disabilita 2FA",
      twoFactorVerifyCta: "Conferma codice",
      twoFactorCodeLabel: "Codice app",
      twoFactorSecretLabel: "Secret key",
      twoFactorOtpAuthLabel: "URI otpauth",
      twoFactorHint: "Inserisci la chiave nell'app Authenticator e poi conferma con un codice a 6 cifre.",
      cancelCta: "Annulla",
      webPushTitle: "Notifiche web push",
      webPushDescription: "Ricevi notifiche browser anche quando non hai la pagina aperta.",
      webPushSupported: "Browser compatibile con web push.",
      webPushNotSupported: "Web push non supportato da questo browser/dispositivo.",
      webPushMissingKey: "Chiave pubblica Web Push non configurata.",
      webPushEnabled: "Web push attivo",
      webPushDisabled: "Web push disattivo",
      webPushEnableCta: "Attiva web push",
      webPushDisableCta: "Disattiva web push",
      webPushProcessing: "Elaborazione...",
      webPushTestCta: "Invia test Web Push",
      notificationPrefsTitle: "Preferenze notifiche",
      notificationPrefsDescription: "Scegli su quali canali ricevere notifiche automatiche.",
      notificationEmailLabel: "Email",
      notificationTelegramLabel: "Telegram",
      notificationWebPushLabel: "App/Web Push",
      notificationLocalAlwaysOnLabel: "Notifiche locali (sempre attive)",
      notificationPrefsSaveCta: "Salva preferenze",
      notificationsRetentionDaysLabel: "Conservazione notifiche locali (giorni)",
      notificationsRetentionDaysHint: "Le notifiche locali più vecchie saranno cancellate automaticamente dal server.",
    },
    pwaInstall: {
      title: "Installa NekoGym",
      description: "Aggiungi l'app alla home per un accesso rapido e notifiche più affidabili.",
      installCta: "Installa",
      dismissCta: "Non ora",
    },
    webPushPrompt: {
      title: "Attiva le notifiche",
      description: "Ricevi avvisi su prenotazioni, cambi lezione e comunicazioni importanti.",
      enableCta: "Attiva",
      dismissCta: "Non ora",
      unsupported: "Le notifiche Web Push non sono disponibili in questo browser.",
      enabled: "Notifiche Web Push attivate.",
    },
    bookings: {
      title: "Prenotazioni",
      description: "Scegli il giorno e prenota il tuo posto.",
      calendarTitle: "Lezioni disponibili",
      monthNavigationLabel: "Naviga mese per mese",
      empty: "Nessuna lezione disponibile nel periodo selezionato.",
      seatsLabel: "Posti residui",
      bookedLabel: "Iscritti",
      youAreBooked: "Gia iscritto",
      awaitingConfirmation: "In attesa conferma",
      accessDenied: "Accesso non consentito",
      courseTag: "Corso",
      detailsCta: "Dettagli",
      detailsTitle: "Dettaglio lezione",
      detailsDescription: "Consulta informazioni e azioni disponibili.",
      startsAtLabel: "Inizio",
      endsAtLabel: "Fine",
      trainerLabel: "Trainer",
      closeCta: "Chiudi",
      prevMonth: "Mese precedente",
      nextMonth: "Mese successivo",
      bookCta: "Prenota",
      unbookCta: "Disiscriviti",
      confirmUnbookTitle: "Conferma disiscrizione",
      confirmUnbookDescription: "Vuoi davvero cancellare la tua prenotazione per questa lezione?",
      confirmUnbookCta: "Si, disiscrivimi",
      confirmKeepBookingCta: "Mantieni prenotazione",
      processing: "Elaborazione...",
      youAreQueued: "In coda",
      queuedLabel: "In coda",
      joinQueueCta: "Mettiti in coda",
      prevWeek: "Settimana precedente",
      nextWeek: "Settimana successiva",
      weekNavigationLabel: "Scegli il giorno",
      today: "Oggi",
      noLessonsDay: "Nessuna lezione in programma in questo giorno.",
      closedDay: "La palestra è chiusa in questo giorno.",
      viewLabel: "Vista",
      viewDay: "Giorno",
      viewWeek: "Settimana",
      viewMonth: "Mese",
      noLessonsWeek: "Nessuna lezione in programma in questa settimana.",
      noLessonsShort: "Nessuna lezione",
      closedShort: "Chiuso",
      lessonsCount: "{n} lezioni",
      lessonsCountOne: "1 lezione",
      monthGridLabel: "Giorni di {month}",
      pendingToConfirm: "{n} da confermare",
      seatsFree: "{n} posti liberi",
      seatFreeOne: "Ultimo posto libero",
      full: "Al completo",
      queueCount: "{n} in coda",
      stampBooked: "Prenotato",
      stampPending: "In attesa",
      stampQueued: "In coda",
      cancelBy: "Puoi disdire fino a {date}",
      cancelClosed: "Non è più possibile disdire",
      costFixed: "Usa 1 ingresso del tuo abbonamento",
      costPeriod: "Conta nel limite del tuo abbonamento",
      requiresConfirmation: "La prenotazione va confermata dallo staff",
      lessonEnded: "Conclusa",
      lessonInProgress: "In corso",
      manageCta: "Gestisci lezione",
      showDetails: "Mostra dettagli di {name}",
      upcomingTitle: "Le tue prossime lezioni",
      upcomingEmpty: "Non hai lezioni prenotate. Scegli un giorno e prenota il tuo posto.",
      dayLessons: "Lezioni di {day}",
      pass: {
        fixedTitle: "Abbonamento {n} ingressi",
        weeklyTitle: "Settimanale · {n} lezioni",
        monthlyTitle: "Mensile · {n} lezioni",
        remaining: "rimasti",
        availableWeek: "liberi questa settimana",
        availableMonth: "liberi questo mese",
        availableWeekOf: "liberi {period}",
        availableMonthOf: "liberi a {period}",
        validUntil: "Valido fino al {date}",
        trialTitle: "Prova gratuita",
        trialUntil: "Puoi prenotare fino al {date}",
        inactiveTitle: "Abbonamento non attivo",
        inactiveBody: "Per prenotare chiedi alla palestra di attivare il tuo abbonamento.",
        openPlanTitle: "Abbonamento attivo",
        openPlanBody: "Nessun limite di lezioni",
        activeBookings: "{n} prenotazioni in corso",
        activeBookingsOne: "1 prenotazione in corso",
        slotsLabel: "{used} usati su {total}",
      },
    },
    lessonsPage: {
      todayTag: "Oggi",
      emptyMonthTitle: "Nessuna lezione",
      emptyMonthFiltered: "Nessuna lezione corrisponde ai filtri in questo mese.",
      backToCurrentMonth: "Torna al mese corrente",
      showAllLessonsCta: "Mostra le lezioni di tutti",
      onlyMineCta: "Solo le mie",
      filtersLabel: "Filtri",
      cancelledTag: "Annullata",
      standaloneTag: "Singola",
      lessonsCount: "{n} lezioni",
      lessonsCountOne: "1 lezione",
      monthLessonsSummary: "{lessons} lezioni · {people} iscritti nel mese",
      manageCta: "Gestisci",
      moreActionsLabel: "Altre azioni per {name}",
      emptyMonth: "Non ci sono lezioni in programma in questo mese. Le lezioni dei corsi vengono generate fino al limite di prenotazione di ciascun corso.",
      title: "Lezioni",
      description: "Elenco mensile delle lezioni, raggruppate per giorno.",
      prevMonth: "Mese precedente",
      nextMonth: "Mese successivo",
      monthNavigationLabel: "Naviga mese per mese",
      emptyDay: "Nessuna lezione in questo giorno.",
      trainerLabel: "Trainer",
      bookedLabel: "Iscritti",
      courseTag: "Corso",
      updateTrainerCta: "Aggiorna trainer",
      modifiedTag: "Modificata",
      modifiedReasonsLabel: "Differenze",
      modifiedReasonTrainer: "trainer",
      modifiedReasonTime: "orario/durata",
      standaloneTitle: "Lezione singola",
      standaloneDescription: "Una lezione fuori dai corsi: puoi crearla una volta o ripeterla.",
      standaloneDuration: "Durata (min)",
      standaloneMaxAttendees: "Max posti",
      standaloneCancellationWindow: "Limite cancellazione (ore)",
      standaloneLessonType: "Tipo lezione",
      lessonTitleLabel: "Titolo lezione",
      lessonDescriptionLabel: "Descrizione lezione",
      startsAtLabel: "Inizio",
      createStandaloneCta: "Crea lezione",
      updateStandaloneCta: "Salva modifiche",
      deleteStandaloneCta: "Elimina",
      deleteLessonCta: "Annulla lezione",
      confirmDeleteLessonTitle: "Annullare la lezione?",
      confirmDeleteLessonDescription: "Gli iscritti riceveranno un avviso e, se hanno un abbonamento a ingressi, la lezione verrà restituita. Potrai ripristinarla dalle lezioni annullate.",
      restoreLessonCta: "Ripristina",
      showDeletedCta: "Mostra annullate",
      hideDeletedCta: "Nascondi annullate",
      showPastCta: "Mostra passate",
      hidePastCta: "Nascondi passate",
      deletedTag: "Cancellata",
      detailsTitle: "Dettaglio lezione",
      detailsDescription: "Consulta i dati della lezione e gli iscritti.",
      detailsTriggerLabel: "Dettagli",
      manageTitle: "Gestisci lezione",
      manageDescription: "Dettagli, trainer e persone della lezione.",
      manageTriggerLabel: "Gestisci lezione",
      manageTabMain: "Informazioni",
      manageTabPeople: "Persone",
      processing: "Elaborazione...",
      closeCta: "Chiudi",
      attendeesLabel: "Iscritti",
      noAttendees: "Nessun iscritto.",
      attendeeSelectLabel: "Utente",
      addAttendeeCta: "Aggiungi",
      removeAttendeeCta: "Rimuovi",
      markAttendancePresentCta: "Presente",
      markAttendanceNoShowCta: "Assente",
      attendanceStatusLabel: "Stato",
      attendanceStatusPresent: "Presente",
      attendanceStatusNoShow: "Assente",
      attendanceStatusUnmarked: "Non segnato",
      pendingApprovalsLabel: "In attesa di conferma",
      noPendingApprovals: "Nessuna iscrizione in attesa.",
      confirmPendingCta: "Conferma",
      confirmPendingAndGrantAccessCta: "Conferma + accesso libero",
      rejectPendingCta: "Non confermare",
      waitlistLabel: "Coda",
      noWaitlist: "Nessuno in coda.",
      confirmWaitlistCta: "Conferma",
      removeWaitlistCta: "Rimuovi dalla coda",
      notifySectionTitle: "Notifica iscritti",
      notifyMessageLabel: "Messaggio",
      notifyMessagePlaceholder: "Scrivi qui il messaggio da inviare...",
      notifySendCta: "Invia notifica",
    },
    usersPage: {
      title: "Utenti",
      description: "Gestisci utenti, ruoli, iscrizioni e piani.",
      createCta: "Nuovo utente",
      createTitle: "Crea utente",
      editTitle: "Modifica utente",
      createDescription: "Compila i campi per creare un nuovo utente.",
      editDescription: "Aggiorna dati, ruolo e piano dell'utente.",
      tableTitle: "Anagrafica utenti",
      empty: "Nessun utente presente.",
      searchPlaceholder: "Cerca per nome o email...",
      filters: {
        allRoles: "Tutti i ruoli",
      },
      columns: {
        name: "Nome",
        email: "Email",
        role: "Ruolo",
        membership: "Iscrizione",
        subscription: "Piano",
        actions: "Azioni",
      },
      fields: {
        name: "Nome",
        email: "Email",
        password: "Password",
        emailVerified: "Email verificata",
        role: "Ruolo",
        membershipStatus: "Stato iscrizione",
        trialEndsAt: "Fine trial",
        subscriptionType: "Tipo piano",
        subscriptionLessons: "Lezioni piano",
        subscriptionRemaining: "Lezioni residue",
        subscriptionResetAt: "Reset piano",
        subscriptionEndsAt: "Fine piano",
        lessonTypeAccess: "Accesso per tipo lezione",
      },
      tabs: {
        profile: "Profilo",
        membership: "Iscrizione",
        subscription: "Piano",
        access: "Accessi",
      },
      actions: {
        save: "Salva",
        reviewCreate: "Rivedi creazione",
        reviewUpdate: "Rivedi aggiornamento",
        cancel: "Annulla",
        edit: "Modifica",
        message: "Messaggio",
        sendMessage: "Invia messaggio",
        delete: "Elimina",
        confirm: "Conferma",
        processing: "Elaborazione...",
      },
      messageDialogTitle: "Invia messaggio",
      messageDialogDescription: "Scrivi un messaggio da inviare a \"{name}\" come notifica.",
      messagePlaceholder: "Scrivi qui il messaggio...",
      confirmCreateTitle: "Conferma creazione utente",
      confirmCreateDescription: "Vuoi creare questo utente?",
      confirmUpdateTitle: "Conferma aggiornamento utente",
      confirmUpdateDescription: "Vuoi salvare le modifiche?",
      deleteConfirmTitle: "Conferma eliminazione",
      deleteConfirmDescription: "Eliminare l'utente \"{name}\"?",
      roleOptions: {
        ADMIN: "Admin",
        TRAINER: "Trainer",
        TRAINEE: "Trainee",
      },
      membershipOptions: {
        ACTIVE: "Attiva",
        INACTIVE: "Inattiva",
      },
      subscriptionOptions: {
        NONE: "Nessuno",
        WEEKLY: "Settimanale",
        MONTHLY: "Mensile",
        FIXED: "Pacchetto fisso",
      },
      lessonTypeAccessOptions: {
        DENIED: "Negato",
        REQUIRES_CONFIRMATION: "Richiede conferma",
        ALLOWED: "Libero accesso",
      },
      passwordCreateHint: "Password obbligatoria per i nuovi utenti.",
      passwordKeepHint: "Lascia vuoto per mantenere la password corrente.",
    },
    auth: {
      loginTitle: "Accedi",
      registerTitle: "Registrazione",
      tabLogin: "Accedi",
      tabRegister: "Iscriviti",
      noAccount: "Non hai un account?",
      hasAccount: "Hai già un account?",
      loginCta: "Accedi",
      registerCta: "Registrati",
      nameLabel: "Nome",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHint: "Almeno 8 caratteri.",
      loginMethodPassword: "Password",
      loginMethodOtp: "Codice",
      loginMethodMagicLink: "Link",
      loginMethodLabel: "Come vuoi accedere?",
      loginMethodOtpHint: "Ti inviamo un codice di 6 cifre via email o Telegram.",
      loginMethodMagicHint: "Ti inviamo un link via email: aprilo e sei dentro.",
      sendCodeCta: "Invia codice",
      verifyCodeCta: "Verifica codice",
      sendMagicLinkCta: "Invia link",
      twoFactorTitle: "Conferma 2FA",
      twoFactorHint: "Inserisci il codice dell'app authenticator per completare l'accesso con password.",
      forgotPasswordCta: "Password dimenticata?",
      resendVerificationCta: "Reinvia email di conferma",
      resendVerificationLabel: "Email da verificare",
      resendVerificationSubmitCta: "Reinvia link",
      firstUserHint: "Se sei il primo utente, verrai creato come Admin.",
      invalidCredentials: "Credenziali non valide.",
    },
    courses: {
      title: "Corsi",
      subtitle: "Crea, aggiorna e gestisci i corsi della palestra.",
      createCta: "Nuovo corso",
      createTitle: "Crea un nuovo corso",
      createDescription: "Compila i campi e conferma la creazione.",
      updateTitle: "Aggiorna corso",
      updateDescription: "Modifica i valori e conferma l'aggiornamento.",
      reviewCreate: "Rivedi creazione",
      reviewUpdate: "Rivedi aggiornamento",
      tabs: {
        main: "Dettagli",
      },
      catalogTitle: "Catalogo corsi",
      empty: "Nessun corso presente. Crea il primo corso.",
      searchPlaceholder: "Cerca per nome o trainer...",
      filterAll: "Tutti",
      filterWithTrainer: "Con trainer",
      filterWithoutTrainer: "Senza trainer",
      showDeletedCta: "Mostra cancellati",
      hideDeletedCta: "Nascondi cancellati",
      deletedTag: "Cancellato",
      columns: {
        name: "Nome",
        lessonType: "Tipo lezione",
        duration: "Durata",
        maxAttendees: "Max partecipanti",
        trainer: "Trainer",
        schedule: "Schedulazione",
        actions: "Azioni",
      },
      actions: {
        edit: "Modifica",
        delete: "Elimina",
        restore: "Ripristina",
        cancel: "Annulla",
        confirm: "Conferma",
        processing: "Elaborazione...",
      },
      fields: {
        name: "Nome",
        description: "Descrizione",
        lessonType: "Tipo lezione",
        trainer: "Trainer",
        durationMinutes: "Durata (minuti)",
        maxAttendees: "Max partecipanti",
        bookingAdvanceMonths: "Anticipo prenotazione (mesi)",
        cancellationWindowHours: "Limite cancellazione (ore)",
      },
      confirm: {
        createTitle: "Conferma creazione corso",
        createDescription: "Vuoi creare questo corso?",
        updateTitle: "Conferma aggiornamento corso",
        updateDescription: "Vuoi salvare queste modifiche?",
        deleteTitle: "Conferma eliminazione corso",
        deleteDescription: "Eliminare \"{name}\"? Questa azione non può essere annullata.",
        deletePolicyTitle: "Lezioni future con iscritti",
        deletePolicyDescription:
          "Il corso \"{name}\" ha {count} lezioni future con iscritti. Vuoi mantenerle o cancellarle (con notifica)?",
        deletePolicyKeepCta: "Tieni lezioni",
        deletePolicyCancelCta: "Cancella lezioni",
      },
      validation: {
        nameRequired: "Il nome e obbligatorio.",
        lessonTypeRequired: "Seleziona un tipo lezione.",
        trainerRequired: "Seleziona un trainer.",
        descriptionRequired: "La descrizione e obbligatoria.",
        numericInvalid: "I campi numerici non sono validi.",
        numericPositive: "I campi numerici devono essere maggiori di zero.",
        scheduleRequired: "Aggiungi almeno uno slot di schedulazione.",
        scheduleInvalid: "La schedulazione contiene orari non validi o duplicati.",
        scheduleOverlap: "Uno o più orari si sovrappongono nello stesso giorno.",
        scheduleClosedWeekday: "Non puoi aggiungere orari in un giorno di chiusura palestra.",
      },
      schedule: {
        title: "Schedulazione settimanale",
        description: "Per ogni giorno puoi aggiungere uno o più orari di inizio. L'orario di fine è calcolato automaticamente.",
        addSlot: "Aggiungi orario",
        noSlots: "Nessun orario configurato",
        removeSlot: "Rimuovi",
        weekdays: {
          MONDAY: "Lunedì",
          TUESDAY: "Martedì",
          WEDNESDAY: "Mercoledì",
          THURSDAY: "Giovedì",
          FRIDAY: "Venerdì",
          SATURDAY: "Sabato",
          SUNDAY: "Domenica",
        },
      },
    },
    appPages: {
      dashboard: {
        title: "Dashboard",
        description: "Benvenuto in NekoGym. Seleziona una voce dal menu laterale per iniziare.",
        stats: {
          activeCourses: "Corsi attivi",
          todayLessons: "Lezioni oggi",
          bookings: "Prenotazioni",
          pendingApprovals: "Conferme in attesa",
        },
        pending: {
          openCta: "Apri conferme",
          dialogTitle: "Conferme pendenti",
          dialogDescription: "Approva o rifiuta richieste di iscrizione in attesa.",
          empty: "Nessuna richiesta in attesa.",
          approveCta: "Conferma",
          approveAndUnlockCta: "Conferma e non chiedere più",
          rejectCta: "Non confermare",
          closeCta: "Chiudi",
        },
        crowding: {
          title: "Affollamento giornaliero",
          description: "Media presenze per fascia oraria sullo stesso giorno della settimana.",
          contextLabel: "Calcolato sugli ultimi {days} giorni omologhi.",
          contextLabelOne: "Calcolato su un solo giorno omologo.",
          previousDay: "Giorno precedente",
          nextDay: "Giorno successivo",
          empty: "Nessuna lezione nel giorno selezionato.",
          avgAttendees: "Media presenze",
        },
        home: {
          greetingMorning: "Buongiorno, {name}",
          greetingAfternoon: "Buon pomeriggio, {name}",
          greetingEvening: "Buonasera, {name}",
          summaryToday: "{lessons} lezioni oggi · {people} iscritti",
          summaryTodayOne: "1 lezione oggi · {people} iscritti",
          summaryNone: "Nessuna lezione oggi",
          todayTitle: "Oggi",
          todayEmpty: "Nessuna lezione in programma oggi.",
          inProgress: "in corso",
          ended: "conclusa",
          queueShort: "{n} in coda",
          pendingShort: "{n} da confermare",
          occupancyLabel: "{booked} iscritti su {max} posti",
          attendeesCta: "Presenze",
          manageCta: "Gestisci",
          todoTitle: "Da fare",
          todoEmpty: "Niente da fare: è tutto in ordine.",
          todoPendingTitle: "Richieste da confermare",
          todoAttendanceTitle: "Presenze da segnare",
          todoAttendanceBody: "{lesson} · {time} · {n} iscritti",
          todoRiskTitle: "Lezione a rischio",
          todoRiskBody: "{lesson} · {when} · nessun iscritto. Sarà annullata {deadline} se resta vuota.",
          todoRiskCta: "Apri il giorno",
          todoAttendanceCta: "Segna presenze",
          nextLessonTitle: "La tua prossima lezione",
          laterTitle: "Più avanti",
          memberEmpty: "Non hai lezioni prenotate.",
          bookCta: "Prenota una lezione",
          seeAllCta: "Vedi tutte le prenotazioni",
        },
        userInsights: {
          chartFutureSuffix: "programmate",
          chartFutureNote: "Tratteggiato: lezioni programmate",
          upcomingTitle: "Le mie prossime lezioni",
          upcomingDescription: "Le prossime lezioni in cui sei trainer o partecipante.",
          upcomingEmpty: "Nessuna lezione futura trovata.",
          roleTrainer: "Trainer",
          roleTrainee: "Trainee",
          bookingPending: "In attesa",
          rankingTitle: "Classifica lezioni per tipo",
          rankingDescription: "Conteggio lezioni per tipologia, ordinato per frequenza.",
          includeFuture: "Includi future",
          rankingEmpty: "Nessun dato disponibile per la classifica.",
          lessonsCountSuffix: "lezioni",
          totalTimeTitle: "Tempo totale in palestra",
          totalTimeDescription: "Somma delle durate delle tue lezioni.",
          totalTimeEmpty: "Nessuna durata disponibile nel filtro corrente.",
          totalTimeHours: "ore",
          chartTitle: "Lezioni per tipo",
          chartDescription: "Lezioni per tipologia nel periodo scelto: piene le svolte, tratteggiate le programmate.",
          chartRangeLabel: "Vista",
          chartRangeWeek: "Settimanale",
          chartRangeMonth: "Mensile",
          chartRangeYear: "Annuale",
          chartEmpty: "Nessun dato disponibile per il grafico nel periodo selezionato.",
        },
      },
      lessons: {
        title: "Lezioni",
        description: "Qui potrai vedere, riprogrammare o cancellare le lezioni.",
      },
      bookings: {
        title: "Prenotazioni",
        description: "Qui potrai gestire prenotazioni, disdette e lista d'attesa.",
      },
      users: {
        title: "Utenti",
        description: "Qui potrai amministrare utenti, ruoli e stato membership.",
      },
      reports: {
        title: "Report",
        description: "Analizza report su corsi, orari, trainer e no-show.",
        empty: "Nessun dato disponibile nel periodo selezionato.",
        trendLabel: "rispetto al periodo precedente",
        trendShort: "vs prec.",
        trendNoPrevious: "nessun dato nel periodo precedente",
        pointsUnit: "pt",
        executiveTitle: "In sintesi",
        executiveTopCourse: "Corso top: {course} con {bookings} prenotazioni.",
        executiveBusiestSlot: "Slot più affollato: {weekday} {time} con riempimento medio {fill}.",
        executiveTopNoShow: "No-show più alto: {name} ({rate}, {count} assenze).",
        exportPdfCta: "Esporta PDF",
        filters: {
          periodLabel: "Periodo",
          last7Days: "7 giorni",
          last30Days: "30 giorni",
          last90Days: "90 giorni",
          applyCta: "Applica",
        },
        kpis: {
          lessonsCount: "Lezioni",
          totalBookings: "Prenotazioni",
          avgFillRate: "Riempimento medio",
        },
        sections: {
          coursePopularityTitle: "Corsi più seguiti",
          timeCrowdingTitle: "Orari più affollati",
          trainerPerformanceTitle: "Trainer più seguiti",
          noShowAnalyticsTitle: "No-show per trainee",
          courseHealthChartTitle: "Riempimento e no-show per corso",
          courseHealthChartDescription: "Confronto tra riempimento medio e tasso no-show dei corsi più frequentati.",
        },
        columns: {
          course: "Corso",
          trainer: "Trainer",
          trainee: "Trainee",
          weekday: "Giorno",
          time: "Orario",
          lessons: "Lezioni",
          bookings: "Prenotazioni",
          markedAttendances: "Presenze segnate",
          present: "Presenti",
          noShow: "No-show",
          noShowRate: "Tasso no-show",
          avgAttendees: "Media partecipanti",
          fillRate: "Riempimento",
          uniqueTrainees: "Trainee unici",
        },
        weekdays: {
          MONDAY: "Lunedì",
          TUESDAY: "Martedì",
          WEDNESDAY: "Mercoledì",
          THURSDAY: "Giovedì",
          FRIDAY: "Venerdì",
          SATURDAY: "Sabato",
          SUNDAY: "Domenica",
        },
        settings: {
          title: "Invio report via email",
          description: "Configura frequenza (settimanale o mensile) e quali report ricevere.",
          frequencyLabel: "Frequenza",
          frequencyNever: "Disattivato",
          frequencyWeekly: "Settimanale",
          frequencyMonthly: "Mensile",
          reportsLabel: "Report da inviare",
          lastSentLabel: "Ultimo invio",
          saveCta: "Salva impostazioni",
          savedMessage: "Impostazioni report salvate.",
        },
      },
      myNotifications: {
        unreadOne: "1 non letta",
        unreadMany: "{n} non lette",
        prevPage: "Precedente",
        nextPage: "Successiva",
        title: "Le mie notifiche",
        description: "Storico notifiche locali ricevute su tutti i dispositivi.",
        empty: "Nessuna notifica disponibile.",
        deleteOneCta: "Elimina",
        deleteAllCta: "Elimina tutte",
        confirmDeleteAllTitle: "Eliminare tutte le notifiche?",
        confirmDeleteAllDescription: "Questa azione rimuovera definitivamente tutte le notifiche locali.",
        confirmDeleteAllConfirmCta: "Conferma",
        confirmDeleteAllCancelCta: "Annulla",
        pageLabel: "Pagina {page} di {totalPages}",
        unreadBadge: "Nuova",
        closeCta: "Chiudi",
      },
    },
    registries: {
      title: "Registri",
      subtitle: "Gestisci i registri applicativi condivisi.",
      tabs: {
        lessonTypes: "Tipi di lezione",
      },
      lessonTypes: {
        title: "Tipi di lezione",
        description: "Definisci nome, descrizione e icona SVG da riutilizzare in corsi e lezioni.",
        nameLabel: "Nome",
        descriptionLabel: "Descrizione",
        iconSvgLabel: "Icona SVG",
        colorLabel: "Colore",
        createCta: "Crea tipo",
        editCta: "Modifica",
        updateTitle: "Modifica tipo di lezione",
        updateCta: "Salva",
        deleteCta: "Elimina",
        deleteConfirmTitle: "Conferma eliminazione",
        deleteConfirmDescription: "Eliminare \"{name}\"? Questa azione non può essere annullata.",
        cancelCta: "Annulla",
        processing: "Elaborazione...",
        empty: "Nessun tipo di lezione.",
      },
    },
    siteSettings: {
      title: "Impostazioni sito",
      subtitle: "Configura nome applicazione, recapiti e calendario apertura.",
      tabs: {
        general: "Generale",
        contacts: "Recapiti",
        notifications: "Notifiche",
        schedule: "Aperture e chiusure",
      },
      fields: {
        siteName: "Nome sito",
        siteLogoSvg: "Logo SVG (path)",
        weeklyResetWeekday: "Giorno reset piano settimanale",
        contactAddress: "Indirizzo",
        contactEmail: "Email contatto",
        contactPhone: "Telefono",
        smtpHost: "Host SMTP",
        smtpPort: "Porta SMTP",
        smtpAuthEnabled: "Usa autenticazione SMTP",
        smtpUser: "Utente SMTP",
        smtpFromEmail: "Email mittente",
        smtpPasswordConfigured: "Password SMTP configurata",
        telegramBotUsername: "Username bot Telegram",
        telegramBotTokenConfigured: "Token bot Telegram configurato",
        smtpSectionTitle: "Configurazione SMTP",
        telegramSectionTitle: "Configurazione Telegram",
        openWeekdays: "Giorni apertura",
        closedDates: "Date chiusura (una per riga)",
      },
      weekdays: {
        MONDAY: "Lunedì",
        TUESDAY: "Martedì",
        WEDNESDAY: "Mercoledì",
        THURSDAY: "Giovedì",
        FRIDAY: "Venerdì",
        SATURDAY: "Sabato",
        SUNDAY: "Domenica",
      },
      actions: {
        save: "Salva impostazioni",
        saving: "Salvataggio...",
        testEmail: "Invia email di test",
        testingEmail: "Invio test...",
        testTelegram: "Invia test Telegram",
        testingTelegram: "Invio test Telegram...",
      },
      readonlyHint: "Questi valori provengono solo da variabili d'ambiente e non sono modificabili da UI.",
      configuredValue: "Configurato",
      missingValue: "Non configurato",
      logoPreview: "Anteprima logo",
      logoPathInvalid: "Inserisci un path SVG locale valido (es. /logo-nekogym.svg).",
      closedDatesInvalid: "Usa una data reale per riga nel formato YYYY-MM-DD.",
    },
    dangerZone: {
      title: "Danger zone",
      subtitle: "Operazioni critiche sul database: backup, ripristino e azzeramento completo.",
      backupTitle: "Backup database",
      backupDescription: "Crea una copia locale del database SQLite (cartella /data/backups).",
      uploadTitle: "Carica backup esterno",
      uploadDescription: "Importa un backup di un altro ambiente (.sqlite, .db, .sqlite3).",
      uploadFileLabel: "File backup",
      uploadCta: "Carica backup",
      uploading: "Caricamento...",
      backupEmpty: "Nessun backup disponibile.",
      backupCreateCta: "Crea backup",
      backupCreating: "Creazione backup...",
      restoreTitle: "Restore da backup",
      restoreDescription: "Ripristina un backup esistente. Operazione protetta da OTP.",
      restoreBackupLabel: "Backup da ripristinare",
      restoreBackupPlaceholder: "Crea prima un backup",
      restoreOtpLabel: "OTP (2FA)",
      restoreWarningConfirm: "Stai per eseguire un restore del database. Vuoi continuare?",
      restoreBackupPromptConfirm: "Vuoi creare un backup prima del restore?",
      restoreCta: "Esegui restore",
      restoring: "Restore in corso...",
      resetTitle: "Reset definitivo",
      resetDescription:
        "Cancella in modo definitivo tutti i dati applicativi tranne: impostazioni di sistema, account admin corrente e sue preferenze.",
      resetConfirmationLabel: "Conferma reset",
      resetConfirmationHint: "Per confermare inserisci esattamente RESET.",
      resetOtpLabel: "OTP (2FA)",
      resetWarningConfirm: "Il reset elimina definitivamente i dati applicativi. Vuoi continuare?",
      resetBackupPromptConfirm: "Vuoi creare un backup prima del reset?",
      resetCta: "Resetta sistema",
      resetting: "Reset in corso...",
      backupDateLabel: "Data",
      backupSizeLabel: "Dimensione",
    },
    manualNotifications: {
      title: "Notifiche manuali",
      subtitle: "Invia notifiche a tutti gli utenti, solo trainer o solo trainee.",
      fields: {
        audience: "Destinatari",
        subject: "Oggetto",
        body: "Messaggio",
      },
      audienceOptions: {
        ALL: "Tutti gli utenti",
        TRAINERS: "Solo trainer",
        TRAINEES: "Solo trainee",
      },
      actions: {
        send: "Invia notifica",
        sending: "Invio...",
        retry: "Riprova",
        retrySelected: "Riprova selezionati",
        retrying: "Riprovo...",
      },
      outbox: {
        title: "Outbox errori",
        empty: "Nessun errore outbox.",
        filters: {
          status: "Stato",
          channel: "Canale",
          from: "Da data",
          to: "A data",
          apply: "Applica filtri",
          reset: "Reset",
        },
        channelOptions: {
          ALL: "Tutti",
          EMAIL: "Email",
          TELEGRAM: "Telegram",
          WEBPUSH: "Web Push",
        },
        statusOptions: {
          ALL: "Tutti",
          PENDING: "In coda",
          PROCESSING: "In lavorazione",
          SENT: "Inviate",
          FAILED: "Fallite",
        },
        pagination: {
          prev: "Precedente",
          next: "Successiva",
          pageInfo: "Pagina {page} di {totalPages} · Totale {total}",
        },
        columns: {
          channel: "Canale",
          recipient: "Destinatario",
          subject: "Oggetto",
          attempts: "Tentativi",
          error: "Errore",
          createdAt: "Creato il",
          actions: "Azioni",
        },
      },
    },
  },
  en: {
    appName: "NekoGym",
    sidebar: {
      title: "Control Panel",
      signedInAs: "Signed in as",
      logout: "Log out",
      localeLabel: "Language",
      themeLabel: "Theme",
      themeToLight: "Switch to light theme",
      themeToDark: "Switch to dark theme",
      settingsSection: "Settings",
      menu: "Menu",
      primaryNav: "Main navigation",
      skipToContent: "Skip to content",
      unreadNotifications: "unread notifications",
      nav: {
        dashboard: "Home",
        courses: "Courses",
        lessons: "Lessons",
        bookings: "Bookings",
        users: "Users",
        reports: "Reports",
        myNotifications: "Notifications",
        profileSettings: "Profile",
        manualNotifications: "Send notifications",
        registries: "Registries",
        siteSettings: "Site settings",
        dangerZone: "Danger zone",
      },
    },
    profileSettings: {
      title: "Profile settings",
      subtitle: "Manage Telegram link and personal preferences.",
      tabs: {
        security: "Security",
        notifications: "Notifications",
        telegram: "Telegram",
      },
      telegramTitle: "Telegram",
      telegramDescription: "Link your Telegram account to receive notifications and use bot commands.",
      linkedStatus: "Telegram linked",
      notLinkedStatus: "Telegram not linked",
      linkedChatIdLabel: "Chat ID",
      linkedUsernameLabel: "Username",
      generateCodeCta: "Start Telegram verification",
      codeLabel: "Link code",
      codeHint: "Use this code with the /link command in the bot.",
      openTelegramCta: "Open Telegram with prefilled command",
      qrHint: "Scan to open Telegram and send the link command automatically.",
      noBotConfiguredHint: "Set TELEGRAM_BOT_USERNAME to enable deep link and QR.",
      commandLabel: "Command",
      expiresHint: "The code expires after 30 minutes.",
      generating: "Generating...",
      accountSecurityTitle: "Account security",
      accountSecurityDescription: "Manage email verification, email change, password and web push.",
      currentEmailLabel: "Current email",
      emailVerifiedStatus: "Email verified",
      emailNotVerifiedStatus: "Email not verified",
      pendingEmailLabel: "New email pending confirmation",
      newEmailLabel: "New email",
      newEmailPlaceholder: "new@email.com",
      sendEmailChangeCta: "Send confirmation",
      currentPasswordLabel: "Current password",
      newPasswordLabel: "New password",
      updatePasswordCta: "Update password",
      twoFactorTitle: "Two-factor authentication (2FA)",
      twoFactorDescription: "Secure password sign-in by requiring a code from your authenticator app.",
      twoFactorEnabled: "2FA enabled",
      twoFactorDisabled: "2FA disabled",
      twoFactorSetupCta: "Set up 2FA",
      twoFactorDisableCta: "Disable 2FA",
      twoFactorVerifyCta: "Verify code",
      twoFactorCodeLabel: "App code",
      twoFactorSecretLabel: "Secret key",
      twoFactorOtpAuthLabel: "otpauth URI",
      twoFactorHint: "Add the secret to your Authenticator app and confirm with a 6-digit code.",
      cancelCta: "Cancel",
      webPushTitle: "Web push notifications",
      webPushDescription: "Receive browser notifications even when the page is closed.",
      webPushSupported: "Browser supports web push.",
      webPushNotSupported: "Web push is not supported on this browser/device.",
      webPushMissingKey: "Web Push public key is not configured.",
      webPushEnabled: "Web push enabled",
      webPushDisabled: "Web push disabled",
      webPushEnableCta: "Enable web push",
      webPushDisableCta: "Disable web push",
      webPushProcessing: "Processing...",
      webPushTestCta: "Send Web Push test",
      notificationPrefsTitle: "Notification preferences",
      notificationPrefsDescription: "Choose which channels receive automatic notifications.",
      notificationEmailLabel: "Email",
      notificationTelegramLabel: "Telegram",
      notificationWebPushLabel: "App/Web Push",
      notificationLocalAlwaysOnLabel: "Local notifications (always on)",
      notificationPrefsSaveCta: "Save preferences",
      notificationsRetentionDaysLabel: "Local notifications retention (days)",
      notificationsRetentionDaysHint: "Older local notifications are automatically deleted by the server.",
    },
    pwaInstall: {
      title: "Install NekoGym",
      description: "Add the app to your home screen for faster access and more reliable notifications.",
      installCta: "Install",
      dismissCta: "Not now",
    },
    webPushPrompt: {
      title: "Enable notifications",
      description: "Get alerts for bookings, lesson changes, and important messages.",
      enableCta: "Enable",
      dismissCta: "Not now",
      unsupported: "Web Push notifications are not available in this browser.",
      enabled: "Web Push notifications enabled.",
    },
    bookings: {
      title: "Bookings",
      description: "Pick a day and book your seat.",
      calendarTitle: "Available lessons",
      monthNavigationLabel: "Browse month by month",
      empty: "No lessons available in the selected range.",
      seatsLabel: "Seats left",
      bookedLabel: "Booked",
      youAreBooked: "Already booked",
      awaitingConfirmation: "Awaiting confirmation",
      accessDenied: "Access denied",
      courseTag: "Course",
      detailsCta: "Details",
      detailsTitle: "Lesson details",
      detailsDescription: "Review lesson data and available actions.",
      startsAtLabel: "Starts",
      endsAtLabel: "Ends",
      trainerLabel: "Trainer",
      closeCta: "Close",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      bookCta: "Book",
      unbookCta: "Unbook",
      confirmUnbookTitle: "Confirm unbooking",
      confirmUnbookDescription: "Do you really want to cancel your booking for this lesson?",
      confirmUnbookCta: "Yes, unbook me",
      confirmKeepBookingCta: "Keep booking",
      processing: "Processing...",
      youAreQueued: "Queued",
      queuedLabel: "Queued",
      joinQueueCta: "Join waitlist",
      prevWeek: "Previous week",
      nextWeek: "Next week",
      weekNavigationLabel: "Pick a day",
      today: "Today",
      noLessonsDay: "No lessons scheduled on this day.",
      closedDay: "The gym is closed on this day.",
      viewLabel: "View",
      viewDay: "Day",
      viewWeek: "Week",
      viewMonth: "Month",
      noLessonsWeek: "No lessons scheduled this week.",
      noLessonsShort: "No lessons",
      closedShort: "Closed",
      lessonsCount: "{n} lessons",
      lessonsCountOne: "1 lesson",
      monthGridLabel: "Days of {month}",
      pendingToConfirm: "{n} to confirm",
      seatsFree: "{n} seats left",
      seatFreeOne: "Last seat left",
      full: "Full",
      queueCount: "{n} waiting",
      stampBooked: "Booked",
      stampPending: "Pending",
      stampQueued: "Waitlisted",
      cancelBy: "You can cancel until {date}",
      cancelClosed: "Cancellation is no longer possible",
      costFixed: "Uses 1 entry of your pass",
      costPeriod: "Counts toward your plan limit",
      requiresConfirmation: "Staff must confirm this booking",
      lessonEnded: "Ended",
      lessonInProgress: "In progress",
      manageCta: "Manage lesson",
      showDetails: "Show details for {name}",
      upcomingTitle: "Your next lessons",
      upcomingEmpty: "You have no booked lessons. Pick a day and book your seat.",
      dayLessons: "Lessons on {day}",
      pass: {
        fixedTitle: "{n}-entry pass",
        weeklyTitle: "Weekly · {n} lessons",
        monthlyTitle: "Monthly · {n} lessons",
        remaining: "left",
        availableWeek: "left this week",
        availableMonth: "left this month",
        availableWeekOf: "left {period}",
        availableMonthOf: "left in {period}",
        validUntil: "Valid until {date}",
        trialTitle: "Free trial",
        trialUntil: "You can book until {date}",
        inactiveTitle: "Membership inactive",
        inactiveBody: "To book, ask the gym to activate your membership.",
        openPlanTitle: "Active membership",
        openPlanBody: "No lesson limit",
        activeBookings: "{n} upcoming bookings",
        activeBookingsOne: "1 upcoming booking",
        slotsLabel: "{used} of {total} used",
      },
    },
    lessonsPage: {
      todayTag: "Today",
      emptyMonthTitle: "No lessons",
      emptyMonthFiltered: "No lessons match the filters this month.",
      backToCurrentMonth: "Back to this month",
      showAllLessonsCta: "Show everyone's lessons",
      onlyMineCta: "Only mine",
      filtersLabel: "Filters",
      cancelledTag: "Cancelled",
      standaloneTag: "One-off",
      lessonsCount: "{n} lessons",
      lessonsCountOne: "1 lesson",
      monthLessonsSummary: "{lessons} lessons · {people} booked this month",
      manageCta: "Manage",
      moreActionsLabel: "More actions for {name}",
      emptyMonth: "There are no lessons scheduled this month. Course lessons are generated up to each course's booking horizon.",
      title: "Lessons",
      description: "Monthly list of lessons grouped by day.",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      monthNavigationLabel: "Browse month by month",
      emptyDay: "No lessons in this day.",
      trainerLabel: "Trainer",
      bookedLabel: "Booked",
      courseTag: "Course",
      updateTrainerCta: "Update trainer",
      modifiedTag: "Modified",
      modifiedReasonsLabel: "Differences",
      modifiedReasonTrainer: "trainer",
      modifiedReasonTime: "time/duration",
      standaloneTitle: "Single lesson",
      standaloneDescription: "A lesson outside the courses: create it once or repeat it.",
      standaloneDuration: "Duration (min)",
      standaloneMaxAttendees: "Max seats",
      standaloneCancellationWindow: "Cancellation window (hours)",
      standaloneLessonType: "Lesson type",
      lessonTitleLabel: "Lesson title",
      lessonDescriptionLabel: "Lesson description",
      startsAtLabel: "Starts at",
      createStandaloneCta: "Create lesson",
      updateStandaloneCta: "Save changes",
      deleteStandaloneCta: "Delete",
      deleteLessonCta: "Cancel lesson",
      confirmDeleteLessonTitle: "Cancel this lesson?",
      confirmDeleteLessonDescription: "Attendees will be notified and, on entry passes, get the lesson back. You can restore it from cancelled lessons.",
      restoreLessonCta: "Restore",
      showDeletedCta: "Show deleted",
      hideDeletedCta: "Hide deleted",
      showPastCta: "Show past",
      hidePastCta: "Hide past",
      deletedTag: "Deleted",
      detailsTitle: "Lesson details",
      detailsDescription: "Review lesson data and attendees.",
      detailsTriggerLabel: "Details",
      manageTitle: "Manage lesson",
      manageDescription: "Details, trainer and people of the lesson.",
      manageTriggerLabel: "Manage lesson",
      manageTabMain: "Information",
      manageTabPeople: "People",
      processing: "Processing...",
      closeCta: "Close",
      attendeesLabel: "Attendees",
      noAttendees: "No attendees.",
      attendeeSelectLabel: "User",
      addAttendeeCta: "Add",
      removeAttendeeCta: "Remove",
      markAttendancePresentCta: "Present",
      markAttendanceNoShowCta: "No-show",
      attendanceStatusLabel: "Status",
      attendanceStatusPresent: "Present",
      attendanceStatusNoShow: "No-show",
      attendanceStatusUnmarked: "Unmarked",
      pendingApprovalsLabel: "Pending approvals",
      noPendingApprovals: "No pending booking requests.",
      confirmPendingCta: "Confirm",
      confirmPendingAndGrantAccessCta: "Confirm + grant access",
      rejectPendingCta: "Reject",
      waitlistLabel: "Waitlist",
      noWaitlist: "No users in waitlist.",
      confirmWaitlistCta: "Confirm",
      removeWaitlistCta: "Remove from waitlist",
      notifySectionTitle: "Notify attendees",
      notifyMessageLabel: "Message",
      notifyMessagePlaceholder: "Write the message to send...",
      notifySendCta: "Send notification",
    },
    usersPage: {
      title: "Users",
      description: "Manage users, roles and membership/subscription settings.",
      createCta: "New user",
      createTitle: "Create user",
      editTitle: "Edit user",
      createDescription: "Fill all fields to create a new user.",
      editDescription: "Update profile, role and subscription plan.",
      tableTitle: "Users list",
      empty: "No users found.",
      searchPlaceholder: "Search by name or email...",
      filters: {
        allRoles: "All roles",
      },
      columns: {
        name: "Name",
        email: "Email",
        role: "Role",
        membership: "Membership",
        subscription: "Subscription",
        actions: "Actions",
      },
      fields: {
        name: "Name",
        email: "Email",
        password: "Password",
        emailVerified: "Email verified",
        role: "Role",
        membershipStatus: "Membership status",
        trialEndsAt: "Trial ends",
        subscriptionType: "Plan type",
        subscriptionLessons: "Plan lessons",
        subscriptionRemaining: "Remaining lessons",
        subscriptionResetAt: "Plan reset",
        subscriptionEndsAt: "Subscription end",
        lessonTypeAccess: "Lesson type access",
      },
      tabs: {
        profile: "Profile",
        membership: "Membership",
        subscription: "Subscription",
        access: "Access",
      },
      actions: {
        save: "Save",
        reviewCreate: "Review creation",
        reviewUpdate: "Review update",
        cancel: "Cancel",
        edit: "Edit",
        message: "Message",
        sendMessage: "Send message",
        delete: "Delete",
        confirm: "Confirm",
        processing: "Processing...",
      },
      messageDialogTitle: "Send message",
      messageDialogDescription: "Write a message to notify \"{name}\".",
      messagePlaceholder: "Write the message here...",
      confirmCreateTitle: "Confirm user creation",
      confirmCreateDescription: "Do you want to create this user?",
      confirmUpdateTitle: "Confirm user update",
      confirmUpdateDescription: "Do you want to save these changes?",
      deleteConfirmTitle: "Confirm deletion",
      deleteConfirmDescription: "Delete user \"{name}\"?",
      roleOptions: {
        ADMIN: "Admin",
        TRAINER: "Trainer",
        TRAINEE: "Trainee",
      },
      membershipOptions: {
        ACTIVE: "Active",
        INACTIVE: "Inactive",
      },
      subscriptionOptions: {
        NONE: "None",
        WEEKLY: "Weekly",
        MONTHLY: "Monthly",
        FIXED: "Fixed pack",
      },
      lessonTypeAccessOptions: {
        DENIED: "Denied",
        REQUIRES_CONFIRMATION: "Requires confirmation",
        ALLOWED: "Open access",
      },
      passwordCreateHint: "Password is required for new users.",
      passwordKeepHint: "Leave empty to keep current password.",
    },
    auth: {
      loginTitle: "Sign in",
      registerTitle: "Register",
      tabLogin: "Sign in",
      tabRegister: "Register",
      noAccount: "No account yet?",
      hasAccount: "Already have an account?",
      loginCta: "Sign in",
      registerCta: "Create account",
      nameLabel: "Name",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHint: "At least 8 characters.",
      loginMethodPassword: "Password",
      loginMethodOtp: "Code",
      loginMethodMagicLink: "Link",
      loginMethodLabel: "How do you want to sign in?",
      loginMethodOtpHint: "We send a 6-digit code by email or Telegram.",
      loginMethodMagicHint: "We email you a link: open it and you're in.",
      sendCodeCta: "Send code",
      verifyCodeCta: "Verify code",
      sendMagicLinkCta: "Send magic link",
      twoFactorTitle: "Confirm 2FA",
      twoFactorHint: "Enter your authenticator app code to complete password sign-in.",
      forgotPasswordCta: "Forgot password?",
      resendVerificationCta: "Resend verification email",
      resendVerificationLabel: "Email to verify",
      resendVerificationSubmitCta: "Resend link",
      firstUserHint: "If you are the first user, you will become Admin.",
      invalidCredentials: "Invalid credentials.",
    },
    courses: {
      title: "Courses",
      subtitle: "Create, update and manage your gym courses.",
      createCta: "Create course",
      createTitle: "Create a new course",
      createDescription: "Fill the fields and confirm the creation.",
      updateTitle: "Update course",
      updateDescription: "Edit values and confirm the update.",
      reviewCreate: "Review creation",
      reviewUpdate: "Review update",
      tabs: {
        main: "Details",
      },
      catalogTitle: "Course catalog",
      empty: "No courses yet. Start by creating your first course.",
      searchPlaceholder: "Search by name or trainer...",
      filterAll: "All",
      filterWithTrainer: "With trainer",
      filterWithoutTrainer: "Without trainer",
      showDeletedCta: "Show deleted",
      hideDeletedCta: "Hide deleted",
      deletedTag: "Deleted",
      columns: {
        name: "Name",
        lessonType: "Lesson type",
        duration: "Duration",
        maxAttendees: "Max attendees",
        trainer: "Trainer",
        schedule: "Schedule",
        actions: "Actions",
      },
      actions: {
        edit: "Edit",
        delete: "Delete",
        restore: "Restore",
        cancel: "Cancel",
        confirm: "Confirm",
        processing: "Processing...",
      },
      fields: {
        name: "Name",
        description: "Description",
        lessonType: "Lesson type",
        trainer: "Trainer",
        durationMinutes: "Duration (minutes)",
        maxAttendees: "Max attendees",
        bookingAdvanceMonths: "Booking advance (months)",
        cancellationWindowHours: "Cancellation limit (hours)",
      },
      confirm: {
        createTitle: "Confirm course creation",
        createDescription: "Do you want to create this course?",
        updateTitle: "Confirm course update",
        updateDescription: "Do you want to save these changes?",
        deleteTitle: "Confirm course deletion",
        deleteDescription: "Delete \"{name}\"? This action cannot be undone.",
        deletePolicyTitle: "Future lessons with attendees",
        deletePolicyDescription:
          "Course \"{name}\" has {count} future lessons with attendees. Do you want to keep them or cancel them (with notifications)?",
        deletePolicyKeepCta: "Keep lessons",
        deletePolicyCancelCta: "Cancel lessons",
      },
      validation: {
        nameRequired: "Name is required.",
        lessonTypeRequired: "Select a lesson type.",
        trainerRequired: "Select a trainer.",
        descriptionRequired: "Description is required.",
        numericInvalid: "Numeric fields are invalid.",
        numericPositive: "Numeric fields must be greater than 0.",
        scheduleRequired: "Add at least one schedule slot.",
        scheduleInvalid: "Schedule contains invalid or duplicate times.",
        scheduleOverlap: "One or more start times overlap on the same weekday.",
        scheduleClosedWeekday: "You cannot add schedule slots on gym-closed weekdays.",
      },
      schedule: {
        title: "Weekly schedule",
        description: "For each day you can add one or more start times. End time is calculated automatically.",
        addSlot: "Add time",
        noSlots: "No times configured",
        removeSlot: "Remove",
        weekdays: {
          MONDAY: "Monday",
          TUESDAY: "Tuesday",
          WEDNESDAY: "Wednesday",
          THURSDAY: "Thursday",
          FRIDAY: "Friday",
          SATURDAY: "Saturday",
          SUNDAY: "Sunday",
        },
      },
    },
    appPages: {
      dashboard: {
        title: "Dashboard",
        description: "Welcome to NekoGym. Select a menu item on the left to get started.",
        stats: {
          activeCourses: "Active courses",
          todayLessons: "Today's lessons",
          bookings: "Bookings",
          pendingApprovals: "Pending approvals",
        },
        pending: {
          openCta: "Open approvals",
          dialogTitle: "Pending approvals",
          dialogDescription: "Approve or reject pending booking requests.",
          empty: "No pending requests.",
          approveCta: "Approve",
          approveAndUnlockCta: "Approve and unlock",
          rejectCta: "Reject",
          closeCta: "Close",
        },
        crowding: {
          title: "Daily crowding",
          description: "Average attendees by hour for the same weekday pattern.",
          contextLabel: "Computed from the last {days} matching days.",
          contextLabelOne: "Computed from a single matching day.",
          previousDay: "Previous day",
          nextDay: "Next day",
          empty: "No lessons on the selected day.",
          avgAttendees: "Average attendees",
        },
        home: {
          greetingMorning: "Good morning, {name}",
          greetingAfternoon: "Good afternoon, {name}",
          greetingEvening: "Good evening, {name}",
          summaryToday: "{lessons} lessons today · {people} booked",
          summaryTodayOne: "1 lesson today · {people} booked",
          summaryNone: "No lessons today",
          todayTitle: "Today",
          todayEmpty: "No lessons scheduled today.",
          inProgress: "in progress",
          ended: "ended",
          queueShort: "{n} waiting",
          pendingShort: "{n} to confirm",
          occupancyLabel: "{booked} booked of {max} seats",
          attendeesCta: "Attendance",
          manageCta: "Manage",
          todoTitle: "To do",
          todoEmpty: "Nothing to do: all clear.",
          todoPendingTitle: "Requests to confirm",
          todoAttendanceTitle: "Attendance to mark",
          todoAttendanceBody: "{lesson} · {time} · {n} booked",
          todoRiskTitle: "Lesson at risk",
          todoRiskBody: "{lesson} · {when} · nobody booked. It will be cancelled {deadline} if it stays empty.",
          todoRiskCta: "Open the day",
          todoAttendanceCta: "Mark attendance",
          nextLessonTitle: "Your next lesson",
          laterTitle: "Coming up",
          memberEmpty: "You have no lessons booked.",
          bookCta: "Book a lesson",
          seeAllCta: "See all bookings",
        },
        userInsights: {
          chartFutureSuffix: "scheduled",
          chartFutureNote: "Hatched: scheduled lessons",
          upcomingTitle: "My upcoming lessons",
          upcomingDescription: "Next lessons where you are trainer or attendee.",
          upcomingEmpty: "No upcoming lessons found.",
          roleTrainer: "Trainer",
          roleTrainee: "Trainee",
          bookingPending: "Pending",
          rankingTitle: "Lesson type ranking",
          rankingDescription: "Lesson count by type, sorted by frequency.",
          includeFuture: "Include future",
          rankingEmpty: "No data available for ranking.",
          lessonsCountSuffix: "lessons",
          totalTimeTitle: "Total time at gym",
          totalTimeDescription: "Sum of lesson durations for your lessons.",
          totalTimeEmpty: "No duration available for current filter.",
          totalTimeHours: "hours",
          chartTitle: "Lessons by type",
          chartDescription: "Lessons by type in the chosen period: solid for held, hatched for scheduled.",
          chartRangeLabel: "View",
          chartRangeWeek: "Weekly",
          chartRangeMonth: "Monthly",
          chartRangeYear: "Yearly",
          chartEmpty: "No chart data available for selected period.",
        },
      },
      lessons: {
        title: "Lessons",
        description: "Here you can view, reschedule or cancel lessons.",
      },
      bookings: {
        title: "Bookings",
        description: "Here you can manage bookings, cancellations and waiting list.",
      },
      users: {
        title: "Users",
        description: "Here you can manage users, roles and membership status.",
      },
      reports: {
        title: "Reports",
        description: "Analyze reports for courses, time slots, trainers and no-shows.",
        empty: "No data available in the selected range.",
        trendLabel: "vs previous period",
        trendShort: "vs prev.",
        trendNoPrevious: "no data in the previous period",
        pointsUnit: "pt",
        executiveTitle: "At a glance",
        executiveTopCourse: "Top course: {course} with {bookings} bookings.",
        executiveBusiestSlot: "Busiest slot: {weekday} {time} with average fill {fill}.",
        executiveTopNoShow: "Highest no-show: {name} ({rate}, {count} absences).",
        exportPdfCta: "Export PDF",
        filters: {
          periodLabel: "Period",
          last7Days: "7 days",
          last30Days: "30 days",
          last90Days: "90 days",
          applyCta: "Apply",
        },
        kpis: {
          lessonsCount: "Lessons",
          totalBookings: "Bookings",
          avgFillRate: "Average fill rate",
        },
        sections: {
          coursePopularityTitle: "Most attended courses",
          timeCrowdingTitle: "Most crowded time slots",
          trainerPerformanceTitle: "Most attended trainers",
          noShowAnalyticsTitle: "No-show by trainee",
          courseHealthChartTitle: "Fill rate and no-show by course",
          courseHealthChartDescription: "Compare average fill rate and no-show rate for the most booked courses.",
        },
        columns: {
          course: "Course",
          trainer: "Trainer",
          trainee: "Trainee",
          weekday: "Weekday",
          time: "Time",
          lessons: "Lessons",
          bookings: "Bookings",
          markedAttendances: "Marked attendances",
          present: "Present",
          noShow: "No-show",
          noShowRate: "No-show rate",
          avgAttendees: "Avg attendees",
          fillRate: "Fill rate",
          uniqueTrainees: "Unique trainees",
        },
        weekdays: {
          MONDAY: "Monday",
          TUESDAY: "Tuesday",
          WEDNESDAY: "Wednesday",
          THURSDAY: "Thursday",
          FRIDAY: "Friday",
          SATURDAY: "Saturday",
          SUNDAY: "Sunday",
        },
        settings: {
          title: "Email report delivery",
          description: "Configure weekly or monthly delivery and choose which reports to receive.",
          frequencyLabel: "Frequency",
          frequencyNever: "Disabled",
          frequencyWeekly: "Weekly",
          frequencyMonthly: "Monthly",
          reportsLabel: "Reports to send",
          lastSentLabel: "Last delivery",
          saveCta: "Save settings",
          savedMessage: "Report settings saved.",
        },
      },
      myNotifications: {
        unreadOne: "1 unread",
        unreadMany: "{n} unread",
        prevPage: "Previous",
        nextPage: "Next",
        title: "My notifications",
        description: "Local notification history across all your devices.",
        empty: "No notifications available.",
        deleteOneCta: "Delete",
        deleteAllCta: "Delete all",
        confirmDeleteAllTitle: "Delete all notifications?",
        confirmDeleteAllDescription: "This action will permanently remove all local notifications.",
        confirmDeleteAllConfirmCta: "Confirm",
        confirmDeleteAllCancelCta: "Cancel",
        pageLabel: "Page {page} of {totalPages}",
        unreadBadge: "New",
        closeCta: "Close",
      },
    },
    registries: {
      title: "Registries",
      subtitle: "Manage shared application registries.",
      tabs: {
        lessonTypes: "Lesson types",
      },
      lessonTypes: {
        title: "Lesson types",
        description: "Define name, description and SVG icon reused by courses and lessons.",
        nameLabel: "Name",
        descriptionLabel: "Description",
        iconSvgLabel: "SVG icon",
        colorLabel: "Color",
        createCta: "Create type",
        editCta: "Edit",
        updateTitle: "Edit lesson type",
        updateCta: "Save",
        deleteCta: "Delete",
        deleteConfirmTitle: "Confirm deletion",
        deleteConfirmDescription: "Delete \"{name}\"? This action cannot be undone.",
        cancelCta: "Cancel",
        processing: "Processing...",
        empty: "No lesson types yet.",
      },
    },
    siteSettings: {
      title: "Site settings",
      subtitle: "Configure site name, contacts and opening schedule.",
      tabs: {
        general: "General",
        contacts: "Contacts",
        notifications: "Notifications",
        schedule: "Open days and closures",
      },
      fields: {
        siteName: "Site name",
        siteLogoSvg: "Logo SVG (path)",
        weeklyResetWeekday: "Weekly plan reset day",
        contactAddress: "Address",
        contactEmail: "Contact email",
        contactPhone: "Phone",
        smtpHost: "SMTP host",
        smtpPort: "SMTP port",
        smtpAuthEnabled: "Use SMTP authentication",
        smtpUser: "SMTP user",
        smtpFromEmail: "From email",
        smtpPasswordConfigured: "SMTP password configured",
        telegramBotUsername: "Telegram bot username",
        telegramBotTokenConfigured: "Telegram bot token configured",
        smtpSectionTitle: "SMTP configuration",
        telegramSectionTitle: "Telegram configuration",
        openWeekdays: "Open weekdays",
        closedDates: "Closed dates (one per line)",
      },
      weekdays: {
        MONDAY: "Monday",
        TUESDAY: "Tuesday",
        WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday",
        FRIDAY: "Friday",
        SATURDAY: "Saturday",
        SUNDAY: "Sunday",
      },
      actions: {
        save: "Save settings",
        saving: "Saving...",
        testEmail: "Send test email",
        testingEmail: "Sending test...",
        testTelegram: "Send Telegram test",
        testingTelegram: "Sending Telegram test...",
      },
      readonlyHint: "These values are loaded from environment variables only and cannot be edited from UI.",
      configuredValue: "Configured",
      missingValue: "Not configured",
      logoPreview: "Logo preview",
      logoPathInvalid: "Use a valid local SVG path (e.g. /logo-nekogym.svg).",
      closedDatesInvalid: "Use one real calendar date per line in YYYY-MM-DD format.",
    },
    dangerZone: {
      title: "Danger zone",
      subtitle: "Critical database operations: backup, restore and full reset.",
      backupTitle: "Database backup",
      backupDescription: "Create a local SQLite database copy (folder /data/backups).",
      uploadTitle: "Upload external backup",
      uploadDescription: "Import a backup from another environment (.sqlite, .db, .sqlite3).",
      uploadFileLabel: "Backup file",
      uploadCta: "Upload backup",
      uploading: "Uploading...",
      backupEmpty: "No backups available.",
      backupCreateCta: "Create backup",
      backupCreating: "Creating backup...",
      restoreTitle: "Restore from backup",
      restoreDescription: "Restore an existing backup. This operation is OTP-protected.",
      restoreBackupLabel: "Backup to restore",
      restoreBackupPlaceholder: "Create a backup first",
      restoreOtpLabel: "OTP (2FA)",
      restoreWarningConfirm: "You are about to restore the database. Do you want to continue?",
      restoreBackupPromptConfirm: "Do you want to create a backup before restore?",
      restoreCta: "Run restore",
      restoring: "Restoring...",
      resetTitle: "Permanent reset",
      resetDescription:
        "Permanently deletes all app data except: system settings, current admin account and its preferences.",
      resetConfirmationLabel: "Reset confirmation",
      resetConfirmationHint: "Type RESET exactly to confirm.",
      resetOtpLabel: "OTP (2FA)",
      resetWarningConfirm: "Reset permanently deletes app data. Do you want to continue?",
      resetBackupPromptConfirm: "Do you want to create a backup before reset?",
      resetCta: "Reset system",
      resetting: "Resetting...",
      backupDateLabel: "Date",
      backupSizeLabel: "Size",
    },
    manualNotifications: {
      title: "Manual notifications",
      subtitle: "Send notifications to all users, only trainers or only trainees.",
      fields: {
        audience: "Audience",
        subject: "Subject",
        body: "Message",
      },
      audienceOptions: {
        ALL: "All users",
        TRAINERS: "Only trainers",
        TRAINEES: "Only trainees",
      },
      actions: {
        send: "Send notification",
        sending: "Sending...",
        retry: "Retry",
        retrySelected: "Retry selected",
        retrying: "Retrying...",
      },
      outbox: {
        title: "Outbox failures",
        empty: "No outbox failures.",
        filters: {
          status: "Status",
          channel: "Channel",
          from: "From date",
          to: "To date",
          apply: "Apply filters",
          reset: "Reset",
        },
        channelOptions: {
          ALL: "All",
          EMAIL: "Email",
          TELEGRAM: "Telegram",
          WEBPUSH: "Web Push",
        },
        statusOptions: {
          ALL: "All",
          PENDING: "Pending",
          PROCESSING: "Processing",
          SENT: "Sent",
          FAILED: "Failed",
        },
        pagination: {
          prev: "Previous",
          next: "Next",
          pageInfo: "Page {page} of {totalPages} · Total {total}",
        },
        columns: {
          channel: "Channel",
          recipient: "Recipient",
          subject: "Subject",
          attempts: "Attempts",
          error: "Error",
          createdAt: "Created at",
          actions: "Actions",
        },
      },
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function withLocalePath(locale: Locale, path: string): string {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export function pickLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const normalized = acceptLanguage.toLowerCase();
  if (normalized.includes("it")) return "it";
  if (normalized.includes("en")) return "en";
  return defaultLocale;
}
