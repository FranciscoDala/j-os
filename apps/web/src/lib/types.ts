export type Empresa = {
    id: string;
    nome_fantasia: string;
    nif?: string | null;
    cnpj?: string | null;
    tipo?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    iban?: string | null;
    iban2?: string | null;
    banco1?: string | null;
    banco2?: string | null;
    logo_url?: string | null;
    image_url?: string | null;
    nif_verified?: boolean;
};
