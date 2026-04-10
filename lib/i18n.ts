export const locales = ["it", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

type Dictionary = {
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
    nav: {
      dashboard: string;
      courses: string;
      lessons: string;
      bookings: string;
      users: string;
      reports: string;
      profileSettings: string;
      manualNotifications: string;
      registries: string;
      siteSettings: string;
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
    notificationPrefsSaveCta: string;
  };
  pwaInstall: {
    title: string;
    description: string;
    installCta: string;
    dismissCta: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    noAccount: string;
    hasAccount: string;
    loginCta: string;
    registerCta: string;
    nameLabel: string;
    emailLabel: string;
    passwordLabel: string;
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
    processing: string;
    youAreQueued: string;
    queuedLabel: string;
    joinQueueCta: string;
  };
  lessonsPage: {
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
    restoreLessonCta: string;
    showDeletedCta: string;
    hideDeletedCta: string;
    deletedTag: string;
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
    waitlistLabel: string;
    noWaitlist: string;
    confirmWaitlistCta: string;
    removeWaitlistCta: string;
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
    };
    tabs: {
      profile: string;
      membership: string;
      subscription: string;
    };
    actions: {
      save: string;
      reviewCreate: string;
      reviewUpdate: string;
      cancel: string;
      edit: string;
      delete: string;
      confirm: string;
      processing: string;
    };
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
      settingsSection: "Settings",
      nav: {
        dashboard: "Dashboard",
        courses: "Corsi",
        lessons: "Lezioni",
        bookings: "Calendario",
        users: "Utenti",
        reports: "Report",
        profileSettings: "Profilo",
        manualNotifications: "Notifiche",
        registries: "Registri",
        siteSettings: "Impostazioni sito",
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
      notificationPrefsSaveCta: "Salva preferenze",
    },
    pwaInstall: {
      title: "Installa NekoGym",
      description: "Aggiungi l'app alla home per un accesso rapido e notifiche più affidabili.",
      installCta: "Installa",
      dismissCta: "Non ora",
    },
    bookings: {
      title: "Calendario",
      description: "Visualizza le lezioni future e prenota i posti disponibili.",
      calendarTitle: "Lezioni disponibili",
      monthNavigationLabel: "Naviga mese per mese",
      empty: "Nessuna lezione disponibile nel periodo selezionato.",
      seatsLabel: "Posti residui",
      bookedLabel: "Iscritti",
      youAreBooked: "Gia iscritto",
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
      bookCta: "Iscriviti",
      unbookCta: "Disiscriviti",
      processing: "Elaborazione...",
      youAreQueued: "In coda",
      queuedLabel: "In coda",
      joinQueueCta: "Mettimi in coda",
    },
    lessonsPage: {
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
      standaloneTitle: "Lezioni standalone",
      standaloneDescription: "Crea e gestisci lezioni non collegate a un corso.",
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
      deleteLessonCta: "Cancella",
      restoreLessonCta: "Ripristina",
      showDeletedCta: "Mostra cancellate",
      hideDeletedCta: "Nascondi cancellate",
      deletedTag: "Cancellata",
      manageTitle: "Gestisci lezione",
      manageDescription: "Modifica dati, trainer e iscritti da questa modale.",
      manageTriggerLabel: "Gestisci lezione",
      manageTabMain: "Main",
      manageTabPeople: "People",
      processing: "Elaborazione...",
      closeCta: "Chiudi",
      attendeesLabel: "Iscritti",
      noAttendees: "Nessun iscritto.",
      attendeeSelectLabel: "Utente",
      addAttendeeCta: "Aggiungi",
      removeAttendeeCta: "Rimuovi",
      waitlistLabel: "Coda",
      noWaitlist: "Nessuno in coda.",
      confirmWaitlistCta: "Conferma",
      removeWaitlistCta: "Rimuovi dalla coda",
    },
    usersPage: {
      title: "Utenti",
      description: "Gestisci utenti, ruoli e configurazioni membership/subscription.",
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
        membership: "Membership",
        subscription: "Subscription",
        actions: "Azioni",
      },
      fields: {
        name: "Nome",
        email: "Email",
        password: "Password",
        emailVerified: "Email verificata",
        role: "Ruolo",
        membershipStatus: "Stato membership",
        trialEndsAt: "Fine trial",
        subscriptionType: "Tipo piano",
        subscriptionLessons: "Lezioni piano",
        subscriptionRemaining: "Lezioni residue",
        subscriptionResetAt: "Reset piano",
        subscriptionEndsAt: "Fine subscription",
      },
      tabs: {
        profile: "Profilo",
        membership: "Membership",
        subscription: "Subscription",
      },
      actions: {
        save: "Salva",
        reviewCreate: "Rivedi creazione",
        reviewUpdate: "Rivedi aggiornamento",
        cancel: "Annulla",
        edit: "Modifica",
        delete: "Elimina",
        confirm: "Conferma",
        processing: "Elaborazione...",
      },
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
      passwordCreateHint: "Password obbligatoria per i nuovi utenti.",
      passwordKeepHint: "Lascia vuoto per mantenere la password corrente.",
    },
    auth: {
      loginTitle: "Accedi",
      registerTitle: "Registrazione",
      noAccount: "Non hai un account?",
      hasAccount: "Hai gia un account?",
      loginCta: "Accedi",
      registerCta: "Registrati",
      nameLabel: "Nome",
      emailLabel: "Email",
      passwordLabel: "Password",
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
        deleteDescription: "Eliminare \"{name}\"? Questa azione non puo essere annullata.",
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
      },
      schedule: {
        title: "Schedulazione settimanale",
        description: "Per ogni giorno puoi aggiungere uno o piu orari di inizio. L'orario di fine e calcolato automaticamente.",
        addSlot: "Aggiungi orario",
        noSlots: "Nessun orario configurato",
        removeSlot: "Rimuovi",
        weekdays: {
          MONDAY: "Lunedi",
          TUESDAY: "Martedi",
          WEDNESDAY: "Mercoledi",
          THURSDAY: "Giovedi",
          FRIDAY: "Venerdi",
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
        description: "Qui potrai analizzare frequenze, popolarita dei corsi e metriche.",
      },
    },
    registries: {
      title: "Registri",
      subtitle: "Gestisci i registri applicativi condivisi.",
      tabs: {
        lessonTypes: "LessonType",
      },
      lessonTypes: {
        title: "Registro LessonType",
        description: "Definisci nome, descrizione e icona SVG da riutilizzare in corsi e lezioni.",
        nameLabel: "Nome",
        descriptionLabel: "Descrizione",
        iconSvgLabel: "Icona SVG",
        colorLabel: "Colore",
        createCta: "Crea tipo",
        editCta: "Modifica",
        updateTitle: "Modifica LessonType",
        updateCta: "Salva",
        deleteCta: "Elimina",
        deleteConfirmTitle: "Conferma eliminazione",
        deleteConfirmDescription: "Eliminare \"{name}\"? Questa azione non puo essere annullata.",
        cancelCta: "Annulla",
        processing: "Elaborazione...",
        empty: "Nessun LessonType presente.",
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
        smtpSectionTitle: "Configurazione SMTP (read-only)",
        telegramSectionTitle: "Configurazione Telegram (read-only)",
        openWeekdays: "Giorni apertura",
        closedDates: "Date chiusura (una per riga)",
      },
      weekdays: {
        MONDAY: "Lunedi",
        TUESDAY: "Martedi",
        WEDNESDAY: "Mercoledi",
        THURSDAY: "Giovedi",
        FRIDAY: "Venerdi",
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
          pageInfo: "Pagina {page}/{totalPages} - Totale {total}",
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
      nav: {
        dashboard: "Dashboard",
        courses: "Courses",
        lessons: "Lessons",
        bookings: "Calendar",
        users: "Users",
        reports: "Reports",
        profileSettings: "Profile",
        manualNotifications: "Notifications",
        registries: "Registries",
        siteSettings: "Site settings",
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
      notificationPrefsSaveCta: "Save preferences",
    },
    pwaInstall: {
      title: "Install NekoGym",
      description: "Add the app to your home screen for faster access and more reliable notifications.",
      installCta: "Install",
      dismissCta: "Not now",
    },
    bookings: {
      title: "Calendar",
      description: "Browse upcoming lessons and book available seats.",
      calendarTitle: "Available lessons",
      monthNavigationLabel: "Browse month by month",
      empty: "No lessons available in the selected range.",
      seatsLabel: "Seats left",
      bookedLabel: "Booked",
      youAreBooked: "Already booked",
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
      processing: "Processing...",
      youAreQueued: "Queued",
      queuedLabel: "Queued",
      joinQueueCta: "Join waitlist",
    },
    lessonsPage: {
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
      standaloneTitle: "Standalone lessons",
      standaloneDescription: "Create and manage lessons not linked to a course.",
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
      deleteLessonCta: "Cancel",
      restoreLessonCta: "Restore",
      showDeletedCta: "Show deleted",
      hideDeletedCta: "Hide deleted",
      deletedTag: "Deleted",
      manageTitle: "Manage lesson",
      manageDescription: "Update data, trainer and attendees from this modal.",
      manageTriggerLabel: "Manage lesson",
      manageTabMain: "Main",
      manageTabPeople: "People",
      processing: "Processing...",
      closeCta: "Close",
      attendeesLabel: "Attendees",
      noAttendees: "No attendees.",
      attendeeSelectLabel: "User",
      addAttendeeCta: "Add",
      removeAttendeeCta: "Remove",
      waitlistLabel: "Waitlist",
      noWaitlist: "No users in waitlist.",
      confirmWaitlistCta: "Confirm",
      removeWaitlistCta: "Remove from waitlist",
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
      },
      tabs: {
        profile: "Profile",
        membership: "Membership",
        subscription: "Subscription",
      },
      actions: {
        save: "Save",
        reviewCreate: "Review creation",
        reviewUpdate: "Review update",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        processing: "Processing...",
      },
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
      passwordCreateHint: "Password is required for new users.",
      passwordKeepHint: "Leave empty to keep current password.",
    },
    auth: {
      loginTitle: "Sign in",
      registerTitle: "Register",
      noAccount: "No account yet?",
      hasAccount: "Already have an account?",
      loginCta: "Sign in",
      registerCta: "Create account",
      nameLabel: "Name",
      emailLabel: "Email",
      passwordLabel: "Password",
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
        description: "Here you can analyze attendance, course popularity and metrics.",
      },
    },
    registries: {
      title: "Registries",
      subtitle: "Manage shared application registries.",
      tabs: {
        lessonTypes: "LessonType",
      },
      lessonTypes: {
        title: "LessonType registry",
        description: "Define name, description and SVG icon reused by courses and lessons.",
        nameLabel: "Name",
        descriptionLabel: "Description",
        iconSvgLabel: "SVG icon",
        colorLabel: "Color",
        createCta: "Create type",
        editCta: "Edit",
        updateTitle: "Edit LessonType",
        updateCta: "Save",
        deleteCta: "Delete",
        deleteConfirmTitle: "Confirm deletion",
        deleteConfirmDescription: "Delete \"{name}\"? This action cannot be undone.",
        cancelCta: "Cancel",
        processing: "Processing...",
        empty: "No LessonType found.",
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
        smtpSectionTitle: "SMTP configuration (read-only)",
        telegramSectionTitle: "Telegram configuration (read-only)",
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
          pageInfo: "Page {page}/{totalPages} - Total {total}",
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
