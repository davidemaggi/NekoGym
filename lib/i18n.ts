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
    settingsSection: string;
    nav: {
      dashboard: string;
      courses: string;
      lessons: string;
      bookings: string;
      users: string;
      reports: string;
      registries: string;
      siteSettings: string;
    };
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
  };
  lessonsPage: {
    title: string;
    description: string;
    prevWeek: string;
    nextWeek: string;
    weekLabel: string;
    emptyDay: string;
    trainerLabel: string;
    bookedLabel: string;
    courseTag: string;
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
      role: string;
      membershipStatus: string;
      trialEndsAt: string;
      subscriptionType: string;
      subscriptionLessons: string;
      subscriptionRemaining: string;
      subscriptionResetAt: string;
      subscriptionEndsAt: string;
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
    catalogTitle: string;
    empty: string;
    searchPlaceholder: string;
    filterAll: string;
    filterWithTrainer: string;
    filterWithoutTrainer: string;
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
      smtp: string;
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
      smtpUser: string;
      smtpPassword: string;
      smtpFromEmail: string;
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
    };
    logoPreview: string;
    logoPathInvalid: string;
    closedDatesInvalid: string;
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
      settingsSection: "Settings",
      nav: {
        dashboard: "Dashboard",
        courses: "Corsi",
        lessons: "Lezioni",
        bookings: "Calendario",
        users: "Utenti",
        reports: "Report",
        registries: "Registri",
        siteSettings: "Impostazioni sito",
      },
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
    },
    lessonsPage: {
      title: "Lezioni",
      description: "Elenco settimanale delle lezioni, raggruppate per giorno.",
      prevWeek: "Settimana precedente",
      nextWeek: "Settimana successiva",
      weekLabel: "Settimana {n}",
      emptyDay: "Nessuna lezione in questo giorno.",
      trainerLabel: "Trainer",
      bookedLabel: "Iscritti",
      courseTag: "Corso",
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
        role: "Ruolo",
        membershipStatus: "Stato membership",
        trialEndsAt: "Fine trial",
        subscriptionType: "Tipo piano",
        subscriptionLessons: "Lezioni piano",
        subscriptionRemaining: "Lezioni residue",
        subscriptionResetAt: "Reset piano",
        subscriptionEndsAt: "Fine subscription",
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
      catalogTitle: "Catalogo corsi",
      empty: "Nessun corso presente. Crea il primo corso.",
      searchPlaceholder: "Cerca per nome o trainer...",
      filterAll: "Tutti",
      filterWithTrainer: "Con trainer",
      filterWithoutTrainer: "Senza trainer",
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
      subtitle: "Configura nome applicazione, recapiti e parametri SMTP.",
      tabs: {
        general: "Generale",
        contacts: "Recapiti",
        smtp: "SMTP",
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
        smtpUser: "Utente SMTP",
        smtpPassword: "Password SMTP",
        smtpFromEmail: "Email mittente",
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
      },
      logoPreview: "Anteprima logo",
      logoPathInvalid: "Inserisci un path SVG locale valido (es. /logo-nekogym.svg).",
      closedDatesInvalid: "Usa una data reale per riga nel formato YYYY-MM-DD.",
    },
  },
  en: {
    appName: "NekoGym",
    sidebar: {
      title: "Control Panel",
      signedInAs: "Signed in as",
      logout: "Log out",
      localeLabel: "Language",
      settingsSection: "Settings",
      nav: {
        dashboard: "Dashboard",
        courses: "Courses",
        lessons: "Lessons",
        bookings: "Calendar",
        users: "Users",
        reports: "Reports",
        registries: "Registries",
        siteSettings: "Site settings",
      },
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
    },
    lessonsPage: {
      title: "Lessons",
      description: "Weekly list of lessons grouped by day.",
      prevWeek: "Previous week",
      nextWeek: "Next week",
      weekLabel: "Week {n}",
      emptyDay: "No lessons in this day.",
      trainerLabel: "Trainer",
      bookedLabel: "Booked",
      courseTag: "Course",
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
        role: "Role",
        membershipStatus: "Membership status",
        trialEndsAt: "Trial ends",
        subscriptionType: "Plan type",
        subscriptionLessons: "Plan lessons",
        subscriptionRemaining: "Remaining lessons",
        subscriptionResetAt: "Plan reset",
        subscriptionEndsAt: "Subscription end",
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
      catalogTitle: "Course catalog",
      empty: "No courses yet. Start by creating your first course.",
      searchPlaceholder: "Search by name or trainer...",
      filterAll: "All",
      filterWithTrainer: "With trainer",
      filterWithoutTrainer: "Without trainer",
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
      subtitle: "Configure site name, contacts and SMTP parameters.",
      tabs: {
        general: "General",
        contacts: "Contacts",
        smtp: "SMTP",
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
        smtpUser: "SMTP user",
        smtpPassword: "SMTP password",
        smtpFromEmail: "From email",
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
      },
      logoPreview: "Logo preview",
      logoPathInvalid: "Use a valid local SVG path (e.g. /logo-nekogym.svg).",
      closedDatesInvalid: "Use one real calendar date per line in YYYY-MM-DD format.",
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

