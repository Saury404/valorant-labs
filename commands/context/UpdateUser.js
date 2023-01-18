import {embedBuilder, getTranslations, ComponentType, ButtonStyle, getFunction} from '../../methods.js';
export async function execute({interaction, args, guilddata} = {}) {
    await interaction.deferReply({ephemeral: true});
    const translations = getTranslations();
    const getLink = getFunction('getLink');
    const link = await getLink({user: interaction.targetUser});
    if (link == null || typeof link.error == 'number')
        return interaction.editReply({
            embeds: [
                embedBuilder({
                    title: translations[guilddata.lang].link.nolink_title,
                    desc: translations[guilddata.lang].link['nolink_other_desc'],
                    footer: 'VALORANT LABS [LINK UNKNOWN]',
                }),
            ],
        });
    const mmr = await axios.get(`https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${link.link.region}/${link.link.puuid}?asia=true`).catch(error => {
        return error;
    });
    if (mmr.response) return errorhandlerinteraction({interaction, status: mmr.response, type: 'mmr', lang: guilddata.lang, data: mmr.response.data});
    if (mmr.data.data.current_data.currenttier == null || mmr.data.data.current_data.games_needed_for_rating != 0 || mmr.data.data.current_data.old) {
        await interaction.targetMember.remove(guilddata.autoroles.map(item => item.id));
        return interaction.editReply({
            embeds: [
                embedBuilder({
                    title: translations[guilddata.lang].mmr.no_rank_title,
                    desc: translations[guilddata.lang].mmr.no_rank_desc,
                    footer: 'VALORANT LABS [MMR ERROR]',
                }),
            ],
        });
    }
    const uneditableroles = [];
    roles.forEach(item => {
        const role = interaction.guild.roles.cache.get(guilddata.autoroles.find(item1 => item1.name == item).id);
        if (!role.editable) uneditableroles.push({name: firstletter(item), value: `<@&${role.id}>`});
    });
    if (uneditableroles.length)
        return interaction.editReply({
            embeds: [
                embedBuilder({
                    title: translations[guilddata.lang].autorole.roles_error_title,
                    desc: translations[guilddata.lang].autorole.roles_error_desc,
                    additionalFields: uneditableroles,
                    footer: 'VALORANT LABS [ROLE PERMISSION ERROR]',
                }),
            ],
        });
    const removerole = guilddata.autoroles
        .filter(item => mmr.data.data.current_data.currenttierpatched.split(' ')[0].toLowerCase() != item.name)
        .map(item => {
            return item.id;
        });
    const addrole = guilddata.autoroles.find(item => mmr.data.data.current_data.currenttierpatched.split(' ')[0].toLowerCase() == item.name)?.id;
    if (!addrole || !removerole?.length)
        return interaction.editReply({
            embeds: [
                embedBuilder({
                    title: translations[guilddata.lang].autorole.settings_not_set_title,
                    desc: translations[guilddata.lang].autorole.settings_not_set_desc,
                    additionalFields: [
                        {
                            name: translations[guilddata.lang].autorole.settings_not_set_affected,
                            value: mmr.data.data.current_data.currenttierpatched.split(' ')[0],
                        },
                    ],
                    footer: 'VALORANT LABS [AUTOROLES CONFIG ERROR]',
                }),
            ],
        });
    await interaction.targetMember.roles.remove(removerole).catch(error => {
        if (error.code == 50013)
            return interaction.editReply({
                embeds: [
                    embedBuilder({
                        title: translations[guilddata.lang].autorole_permission_title,
                        desc: translations[guilddata.lang].autorole_permission_desc,
                        footer: 'VALORANT LABS [NO PERMISSION]',
                    }),
                ],
            });
    });
    await interaction.targetMember.roles.add(addrole).catch(error => {
        if (error.code == 50013)
            return interaction.editReply({
                embeds: [
                    embedBuilder({
                        title: translations[guilddata.lang].autorole_permission_title,
                        desc: translations[guilddata.lang].autorole_permission_desc,
                        footer: 'VALORANT LABS [NO PERMISSION]',
                    }),
                ],
            });
    });
    await getDB('linkv2-logs').insertOne({
        userid: interaction.targetUser.id,
        date: new Date(),
        admin: interaction.user.id,
        guild: {id: interaction.guildId, name: interaction.guild.name},
        type: 'autorole',
        event: 'update',
        rank: {
            name: mmr.data.data.current_data.currenttierpatched.split(' ')[0],
            id: addrole,
        },
        riotid: `${link.name}#${link.tag}`,
        rpuuid: link.link.rpuuid,
        puuid: link.link.puuid,
    });
    return interaction.editReply({
        embeds: [
            embedBuilder({
                title: translations[guilddata.lang].autorole.role_given_title,
                desc: translations[guilddata.lang].autorole.role_given_desc,
            }),
        ],
    });
}
export const name = 'Update Rank Role';
