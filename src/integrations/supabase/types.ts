export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          post_type: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          post_type?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          post_type?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_matches: {
        Row: {
          case_id: string
          consultation_fee_quoted: number | null
          created_at: string
          firm_id: string
          id: string
          message: string | null
          professional_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          consultation_fee_quoted?: number | null
          created_at?: string
          firm_id: string
          id?: string
          message?: string | null
          professional_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          consultation_fee_quoted?: number | null
          created_at?: string
          firm_id?: string
          id?: string
          message?: string | null
          professional_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_matches_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_matches_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_pending_anonymized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_matches_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_matches_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "legal_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          ai_analysis: string | null
          ai_suggested_practice_areas: string[] | null
          assigned_practice_area: string | null
          budget_range: string | null
          created_at: string
          description: string
          documents_url: string[] | null
          facts: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          preferred_consultation_type: string | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_suggested_practice_areas?: string[] | null
          assigned_practice_area?: string | null
          budget_range?: string | null
          created_at?: string
          description: string
          documents_url?: string[] | null
          facts?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          preferred_consultation_type?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_suggested_practice_areas?: string[] | null
          assigned_practice_area?: string | null
          budget_range?: string | null
          created_at?: string
          description?: string
          documents_url?: string[] | null
          facts?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          preferred_consultation_type?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          ai_notes: string | null
          case_id: string
          consultation_type: string | null
          created_at: string
          duration_minutes: number | null
          firm_id: string
          id: string
          meeting_url: string | null
          notes: string | null
          professional_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["consultation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_notes?: string | null
          case_id: string
          consultation_type?: string | null
          created_at?: string
          duration_minutes?: number | null
          firm_id: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          professional_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_notes?: string | null
          case_id?: string
          consultation_type?: string | null
          created_at?: string
          duration_minutes?: number | null
          firm_id?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          professional_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_pending_anonymized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "legal_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          case_id: string | null
          client_id: string
          created_at: string
          firm_id: string
          id: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          client_id: string
          created_at?: string
          firm_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          client_id?: string
          created_at?: string
          firm_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_pending_anonymized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      document_annotations: {
        Row: {
          annotation_data: Json
          annotation_type: string
          color: string | null
          created_at: string
          created_by: string
          document_id: string
          id: string
          page_number: number
          updated_at: string
        }
        Insert: {
          annotation_data: Json
          annotation_type: string
          color?: string | null
          created_at?: string
          created_by: string
          document_id: string
          id?: string
          page_number?: number
          updated_at?: string
        }
        Update: {
          annotation_data?: Json
          annotation_type?: string
          color?: string | null
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          page_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_annotations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          annotation_id: string | null
          content: string
          created_at: string
          created_by: string
          document_id: string
          id: string
          is_resolved: boolean
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          annotation_id?: string | null
          content: string
          created_at?: string
          created_by: string
          document_id: string
          id?: string
          is_resolved?: boolean
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          annotation_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          is_resolved?: boolean
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "document_annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_firm_shares: {
        Row: {
          document_id: string
          firm_id: string
          id: string
          shared_at: string
          shared_by: string
        }
        Insert: {
          document_id: string
          firm_id: string
          id?: string
          shared_at?: string
          shared_by: string
        }
        Update: {
          document_id?: string
          firm_id?: string
          id?: string
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_firm_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_firm_shares_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          document_id: string
          file_path: string
          file_size: number | null
          id: string
          is_current: boolean
          uploaded_at: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          document_id: string
          file_path: string
          file_size?: number | null
          id?: string
          is_current?: boolean
          uploaded_at?: string
          uploaded_by: string
          version_number?: number
        }
        Update: {
          document_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_current?: boolean
          uploaded_at?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firms: {
        Row: {
          address: string | null
          awards: Json | null
          city: string | null
          consultation_fee: number | null
          country: string | null
          created_at: string
          description: string | null
          firm_name: string
          firm_type: string | null
          google_reviews_url: string | null
          id: string
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          nda_signed: boolean | null
          nda_signed_at: string | null
          practice_areas: string[] | null
          regulatory_body: string | null
          regulatory_number: string | null
          subscription_tier: string | null
          trustpilot_url: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          awards?: Json | null
          city?: string | null
          consultation_fee?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          firm_name: string
          firm_type?: string | null
          google_reviews_url?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nda_signed?: boolean | null
          nda_signed_at?: string | null
          practice_areas?: string[] | null
          regulatory_body?: string | null
          regulatory_number?: string | null
          subscription_tier?: string | null
          trustpilot_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          awards?: Json | null
          city?: string | null
          consultation_fee?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          firm_name?: string
          firm_type?: string | null
          google_reviews_url?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nda_signed?: boolean | null
          nda_signed_at?: string | null
          practice_areas?: string[] | null
          regulatory_body?: string | null
          regulatory_number?: string | null
          subscription_tier?: string | null
          trustpilot_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      legal_professionals: {
        Row: {
          avatar_url: string | null
          awards: Json | null
          bio: string | null
          can_accept_cases_independently: boolean | null
          consultation_fee: number | null
          created_at: string
          email: string | null
          firm_id: string
          full_name: string
          google_reviews_url: string | null
          id: string
          is_active: boolean | null
          regulatory_body: string | null
          regulatory_number: string | null
          specializations: string[] | null
          title: string | null
          trustpilot_url: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          awards?: Json | null
          bio?: string | null
          can_accept_cases_independently?: boolean | null
          consultation_fee?: number | null
          created_at?: string
          email?: string | null
          firm_id: string
          full_name: string
          google_reviews_url?: string | null
          id?: string
          is_active?: boolean | null
          regulatory_body?: string | null
          regulatory_number?: string | null
          specializations?: string[] | null
          title?: string | null
          trustpilot_url?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          awards?: Json | null
          bio?: string | null
          can_accept_cases_independently?: boolean | null
          consultation_fee?: number | null
          created_at?: string
          email?: string | null
          firm_id?: string
          full_name?: string
          google_reviews_url?: string | null
          id?: string
          is_active?: boolean | null
          regulatory_body?: string | null
          regulatory_number?: string | null
          specializations?: string[] | null
          title?: string | null
          trustpilot_url?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_professionals_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          consultation_id: string | null
          created_at: string
          currency: string
          description: string | null
          firm_id: string | null
          id: string
          metadata: Json | null
          payment_type: string
          status: string
          stripe_payment_id: string | null
          stripe_refund_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          consultation_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          firm_id?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          consultation_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          firm_id?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          admin_notes: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          firm_id: string | null
          gross_amount: number
          id: string
          net_amount: number
          payment_transactions: Json | null
          processed_at: string | null
          processed_by: string | null
          professional_id: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          commission_amount: number
          commission_rate?: number
          created_at?: string
          firm_id?: string | null
          gross_amount: number
          id?: string
          net_amount: number
          payment_transactions?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          professional_id?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          firm_id?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          payment_transactions?: Json | null
          processed_at?: string | null
          processed_by?: string | null
          professional_id?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "legal_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      practice_areas: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          phone: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      regulatory_bodies: {
        Row: {
          abbreviation: string
          country: string
          created_at: string
          description: string | null
          id: string
          name: string
          practice_areas: string[] | null
          updated_at: string
          verification_url: string | null
          website: string | null
        }
        Insert: {
          abbreviation: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          practice_areas?: string[] | null
          updated_at?: string
          verification_url?: string | null
          website?: string | null
        }
        Update: {
          abbreviation?: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          practice_areas?: string[] | null
          updated_at?: string
          verification_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          consultation_id: string | null
          created_at: string
          firm_id: string
          id: string
          is_anonymous: boolean | null
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          firm_id: string
          id?: string
          is_anonymous?: boolean | null
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          firm_id?: string
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_documents: {
        Row: {
          case_id: string | null
          category: string | null
          conversation_id: string | null
          created_at: string
          display_order: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_encrypted: boolean
          mime_type: string | null
          shared_with_client: boolean
          shared_with_firm: boolean
          uploaded_by: string
          uploader_type: string
        }
        Insert: {
          case_id?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          display_order?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_encrypted?: boolean
          mime_type?: string | null
          shared_with_client?: boolean
          shared_with_firm?: boolean
          uploaded_by: string
          uploader_type: string
        }
        Update: {
          case_id?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          display_order?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_encrypted?: boolean
          mime_type?: string | null
          shared_with_client?: boolean
          shared_with_firm?: boolean
          uploaded_by?: string
          uploader_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_pending_anonymized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cases_pending_anonymized: {
        Row: {
          ai_analysis_status: string | null
          ai_suggested_practice_areas: string[] | null
          assigned_practice_area: string | null
          budget_range: string | null
          created_at: string | null
          facts: string | null
          id: string | null
          moderation_notes: string | null
          moderation_status: string | null
          preferred_consultation_type: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          summary: string | null
          title: string | null
          urgency_level: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis_status?: never
          ai_suggested_practice_areas?: string[] | null
          assigned_practice_area?: string | null
          budget_range?: never
          created_at?: string | null
          facts?: never
          id?: string | null
          moderation_notes?: never
          moderation_status?: never
          preferred_consultation_type?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          summary?: never
          title?: string | null
          urgency_level?: string | null
          user_id?: never
        }
        Update: {
          ai_analysis_status?: never
          ai_suggested_practice_areas?: string[] | null
          assigned_practice_area?: string | null
          budget_range?: never
          created_at?: string | null
          facts?: never
          id?: string | null
          moderation_notes?: never
          moderation_status?: never
          preferred_consultation_type?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          summary?: never
          title?: string | null
          urgency_level?: string | null
          user_id?: never
        }
        Relationships: []
      }
    }
    Functions: {
      firm_can_view_pending_case: {
        Args: {
          p_practice_area: string
          p_suggested_areas: string[]
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_firm_has_match: {
        Args: { p_case_id: string; p_user_id: string }
        Returns: boolean
      }
      user_owns_case: {
        Args: { p_case_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      case_status:
        | "pending"
        | "matched"
        | "consultation_scheduled"
        | "accepted"
        | "rejected"
        | "completed"
      consultation_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_type: "individual" | "firm"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      case_status: [
        "pending",
        "matched",
        "consultation_scheduled",
        "accepted",
        "rejected",
        "completed",
      ],
      consultation_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      user_type: ["individual", "firm"],
    },
  },
} as const
