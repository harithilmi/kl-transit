CREATE TABLE IF NOT EXISTS "kl-transit_route_shape" (
	"route_number" varchar(20) NOT NULL,
	"direction" integer NOT NULL,
	"coordinates" jsonb NOT NULL,
	CONSTRAINT "kl-transit_route_shape_route_number_direction_pk" PRIMARY KEY("route_number","direction")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kl-transit_route_suggestion" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_number" varchar(20) NOT NULL,
	"direction" integer NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"stops" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kl-transit_route" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_number" varchar(20) NOT NULL,
	"route_name" varchar(200) NOT NULL,
	"route_type" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "kl-transit_route_route_number_unique" UNIQUE("route_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kl-transit_service" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_number" varchar(20) NOT NULL,
	"stop_id" varchar(50) NOT NULL,
	"direction" integer NOT NULL,
	"zone" integer NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kl-transit_stop" (
	"id" serial PRIMARY KEY NOT NULL,
	"stop_id" varchar(50) NOT NULL,
	"stop_code" varchar(20),
	"stop_name" varchar(100) NOT NULL,
	"street_name" varchar(100),
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "kl-transit_stop_stop_id_unique" UNIQUE("stop_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kl-transit_route_shape" ADD CONSTRAINT "kl-transit_route_shape_route_number_kl-transit_route_route_number_fk" FOREIGN KEY ("route_number") REFERENCES "public"."kl-transit_route"("route_number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kl-transit_route_suggestion" ADD CONSTRAINT "kl-transit_route_suggestion_route_number_kl-transit_route_route_number_fk" FOREIGN KEY ("route_number") REFERENCES "public"."kl-transit_route"("route_number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kl-transit_service" ADD CONSTRAINT "kl-transit_service_stop_id_kl-transit_stop_stop_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."kl-transit_stop"("stop_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_shape_idx" ON "kl-transit_route_shape" USING btree ("route_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_suggestion_idx" ON "kl-transit_route_suggestion" USING btree ("route_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_suggestion_idx" ON "kl-transit_route_suggestion" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_number_idx" ON "kl-transit_route" USING btree ("route_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_stop_idx" ON "kl-transit_service" USING btree ("route_number","stop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sequence_idx" ON "kl-transit_service" USING btree ("route_number","sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stop_id_idx" ON "kl-transit_stop" USING btree ("stop_id");